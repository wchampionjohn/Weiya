require 'rails_helper'

RSpec.describe DrawService do
  let(:event) { create(:event, :active) }
  let(:prize) { create(:prize, event: event, quantity: 2) }
  let!(:event_participants) do
    participants = create_list(:participant, 5)
    participants.map { |p| create(:event_participant, event: event, participant: p) }
  end

  describe '#call' do
    subject { described_class.new(prize).call }

    it 'returns success result' do
      expect(subject.success?).to be true
    end

    it 'creates winners' do
      expect { subject }.to change(Winner, :count).by(2)
    end

    it 'returns drawn winners' do
      expect(subject.winners.size).to eq(2)
    end

    it 'marks prize as drawn when all spots filled' do
      subject
      expect(prize.reload.drawn).to be true
    end

    it 'broadcasts draw result' do
      expect(ActionCable.server).to receive(:broadcast).with(
        "draw_channel_#{event.id}",
        hash_including(type: 'draw_result', prize_id: prize.id)
      )
      subject
    end

    context 'when prize already drawn' do
      before { prize.update!(drawn: true) }

      it 'returns failure' do
        expect(subject.success?).to be false
        expect(subject.error).to eq('Prize already drawn')
      end
    end

    context 'when no eligible participants' do
      before { EventParticipant.destroy_all }

      it 'returns failure' do
        expect(subject.success?).to be false
        expect(subject.error).to eq('No eligible participants')
      end
    end

    context 'with count parameter' do
      subject { described_class.new(prize, count: 1).call }

      it 'draws specified number of winners' do
        expect(subject.winners.size).to eq(1)
      end

      it 'does not mark prize as drawn if more spots remain' do
        subject
        expect(prize.reload.drawn).to be false
      end
    end

    context 'with admin parameter' do
      let(:admin) { create(:admin) }
      subject { described_class.new(prize, admin: admin).call }

      it 'records admin as drawer when fully drawn' do
        subject
        expect(prize.reload.drawn_by).to eq(admin.id)
      end
    end

    context 'with repeat win disabled' do
      before { event.update!(allow_repeat_win: false) }

      it 'excludes participants who already won' do
        first_prize = create(:prize, event: event, quantity: 3)
        described_class.new(first_prize).call

        second_prize = create(:prize, event: event, quantity: 2)
        result = described_class.new(second_prize).call

        all_winner_ids = Winner.pluck(:event_participant_id)
        expect(all_winner_ids.uniq.size).to eq(all_winner_ids.size)
      end
    end
  end

  describe '#call with simulate: true' do
    subject { described_class.new(prize, simulate: true).call }

    it 'returns success result' do
      expect(subject.success?).to be true
    end

    it 'does not create winners' do
      expect { subject }.not_to change(Winner, :count)
    end

    it 'returns simulated winners' do
      expect(subject.winners.size).to eq(2)
      expect(subject.winners.first[:simulated]).to be true
    end

    it 'allows simulation even when prize is drawn' do
      prize.update!(drawn: true)
      expect(subject.success?).to be true
    end

    it 'broadcasts simulation result' do
      expect(ActionCable.server).to receive(:broadcast).with(
        "draw_channel_#{event.id}",
        hash_including(type: 'simulation_result', prize_id: prize.id)
      )
      subject
    end
  end

  describe 'eligibility rules filtering' do
    let(:event) { create(:event, :active, event_date: Date.new(2025, 12, 31)) }
    let(:prize_with_rules) { create(:prize, event: event, quantity: 2) }

    context 'with minimum seniority requirement' do
      let!(:senior_participant) do
        p = create(:participant, hire_date: Date.new(2020, 1, 1))
        create(:event_participant, event: event, participant: p)
      end
      let!(:junior_participant) do
        p = create(:participant, hire_date: Date.new(2024, 6, 1))
        create(:event_participant, event: event, participant: p)
      end
      let!(:no_hire_date_participant) do
        p = create(:participant, hire_date: nil)
        create(:event_participant, event: event, participant: p)
      end

      before do
        prize_with_rules.update!(eligibility_rules: { 'min_seniority_years' => 3 })
      end

      it 'only draws from participants meeting seniority requirement' do
        result = described_class.new(prize_with_rules, count: 1).call
        expect(result.success?).to be true
        winner_ep_ids = result.winners.map(&:event_participant_id)
        expect(winner_ep_ids).to include(senior_participant.id)
        expect(winner_ep_ids).not_to include(junior_participant.id)
        expect(winner_ep_ids).not_to include(no_hire_date_participant.id)
      end
    end

    context 'with department requirement' do
      let!(:engineering_participant) do
        p = create(:participant, department: 'Engineering')
        create(:event_participant, event: event, participant: p)
      end
      let!(:marketing_participant) do
        p = create(:participant, department: 'Marketing')
        create(:event_participant, event: event, participant: p)
      end
      let!(:sales_participant) do
        p = create(:participant, department: 'Sales')
        create(:event_participant, event: event, participant: p)
      end

      before do
        prize_with_rules.update!(eligibility_rules: { 'departments' => ['Engineering', 'Marketing'] })
      end

      it 'only draws from participants in specified departments' do
        result = described_class.new(prize_with_rules, count: 2).call
        expect(result.success?).to be true
        winner_ep_ids = result.winners.map(&:event_participant_id)
        expect(winner_ep_ids).to include(engineering_participant.id)
        expect(winner_ep_ids).to include(marketing_participant.id)
        expect(winner_ep_ids).not_to include(sales_participant.id)
      end
    end

    context 'with combined seniority and department requirements' do
      let!(:eligible_participant) do
        p = create(:participant, hire_date: Date.new(2020, 1, 1), department: 'Engineering')
        create(:event_participant, event: event, participant: p)
      end
      let!(:senior_wrong_dept) do
        p = create(:participant, hire_date: Date.new(2020, 1, 1), department: 'Sales')
        create(:event_participant, event: event, participant: p)
      end
      let!(:junior_right_dept) do
        p = create(:participant, hire_date: Date.new(2024, 6, 1), department: 'Engineering')
        create(:event_participant, event: event, participant: p)
      end

      before do
        prize_with_rules.update!(eligibility_rules: {
          'min_seniority_years' => 3,
          'departments' => ['Engineering']
        })
      end

      it 'only draws from participants meeting all requirements' do
        result = described_class.new(prize_with_rules, count: 1).call
        expect(result.success?).to be true
        winner_ep_ids = result.winners.map(&:event_participant_id)
        expect(winner_ep_ids).to eq([eligible_participant.id])
      end
    end

    context 'when no participants meet requirements' do
      let!(:ineligible_participants) do
        3.times.map do
          p = create(:participant, hire_date: Date.new(2024, 1, 1), department: 'Sales')
          create(:event_participant, event: event, participant: p)
        end
      end

      before do
        prize_with_rules.update!(eligibility_rules: {
          'min_seniority_years' => 10,
          'departments' => ['Engineering']
        })
      end

      it 'returns failure with no eligible participants' do
        result = described_class.new(prize_with_rules).call
        expect(result.success?).to be false
        expect(result.error).to eq('No eligible participants')
      end
    end
  end

  describe 'designated winner' do
    let(:event) { create(:event, :active) }
    let(:designated_participant) { create(:participant, name: 'CEO') }
    let!(:designated_ep) { create(:event_participant, event: event, participant: designated_participant) }
    let!(:other_participants) do
      3.times.map do
        p = create(:participant)
        create(:event_participant, event: event, participant: p)
      end
    end

    context 'with designated participant in event' do
      let(:prize_with_designated) do
        create(:prize, event: event, quantity: 1, designated_participant: designated_participant)
      end

      it 'always draws the designated participant' do
        result = described_class.new(prize_with_designated).call
        expect(result.success?).to be true
        expect(result.winners.size).to eq(1)
        expect(result.winners.first.event_participant_id).to eq(designated_ep.id)
      end

      it 'marks winner as designated' do
        result = described_class.new(prize_with_designated).call
        expect(result.winners.first.is_designated).to be true
      end

      it 'marks prize as fully drawn' do
        result = described_class.new(prize_with_designated).call
        expect(prize_with_designated.reload.drawn).to be true
      end
    end

    context 'with designated participant not in event' do
      let(:external_participant) { create(:participant, name: 'External') }
      let(:prize_with_external) do
        create(:prize, event: event, quantity: 1, designated_participant: external_participant)
      end

      it 'returns failure' do
        result = described_class.new(prize_with_external).call
        expect(result.success?).to be false
        expect(result.error).to eq('指定中獎人不在活動參與者名單中')
      end

      it 'does not create any winners' do
        expect {
          described_class.new(prize_with_external).call
        }.not_to change(Winner, :count)
      end
    end

    context 'without designated participant' do
      let(:regular_prize) { create(:prize, event: event, quantity: 1) }

      it 'performs random draw' do
        result = described_class.new(regular_prize).call
        expect(result.success?).to be true
        expect(result.winners.size).to eq(1)
        expect(result.winners.first.is_designated).to be_falsey
      end
    end
  end
end
