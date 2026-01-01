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
end
