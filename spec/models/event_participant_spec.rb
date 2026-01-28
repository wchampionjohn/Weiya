require 'rails_helper'

RSpec.describe EventParticipant, type: :model do
  describe 'associations' do
    it { should belong_to(:event) }
    it { should belong_to(:participant) }
    it { should have_many(:winners).dependent(:destroy) }
  end

  describe 'validations' do
    it { should validate_presence_of(:event_id) }
    it { should validate_presence_of(:participant_id) }

    it 'validates uniqueness of participant per event' do
      event_participant = create(:event_participant)
      duplicate = build(:event_participant, event: event_participant.event, participant: event_participant.participant)
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:participant_id]).to include('已加入此活動')
    end
  end

  describe 'scopes' do
    describe '.eligible_for' do
      let(:event) { create(:event, allow_repeat_win: false) }
      let(:prize) { create(:prize, event: event) }
      let!(:event_participant1) { create(:event_participant, event: event) }
      let!(:event_participant2) { create(:event_participant, event: event) }

      it 'excludes participants who already won' do
        create(:winner, prize: prize, event_participant: event_participant1)
        eligible = EventParticipant.eligible_for(prize)
        expect(eligible).to include(event_participant2)
        expect(eligible).not_to include(event_participant1)
      end

      it 'includes all when repeat wins allowed' do
        event.update!(allow_repeat_win: true)
        create(:winner, prize: prize, event_participant: event_participant1)
        expect(EventParticipant.eligible_for(prize)).to include(event_participant1, event_participant2)
      end

      it 'respects prize-level repeat win override' do
        prize.update!(allow_repeat_win_override: true)
        create(:winner, prize: prize, event_participant: event_participant1)
        expect(EventParticipant.eligible_for(prize)).to include(event_participant1, event_participant2)
      end
    end

    describe '.not_won_in_event' do
      let(:event) { create(:event) }
      let(:prize) { create(:prize, event: event) }
      let!(:event_participant1) { create(:event_participant, event: event) }
      let!(:event_participant2) { create(:event_participant, event: event) }

      it 'excludes participants who have won any prize' do
        create(:winner, prize: prize, event_participant: event_participant1)
        expect(EventParticipant.not_won_in_event).to include(event_participant2)
        expect(EventParticipant.not_won_in_event).not_to include(event_participant1)
      end
    end
  end

  describe 'delegated methods' do
    let(:participant) { create(:participant, name: '王小明', employee_id: 'E001', phone: '0912345678', email: 'test@example.com') }
    let(:event_participant) { create(:event_participant, participant: participant) }

    it 'delegates name to participant' do
      expect(event_participant.name).to eq('王小明')
    end

    it 'delegates employee_id to participant' do
      expect(event_participant.employee_id).to eq('E001')
    end

    it 'delegates phone to participant' do
      expect(event_participant.phone).to eq('0912345678')
    end

    it 'delegates email to participant' do
      expect(event_participant.email).to eq('test@example.com')
    end
  end

  describe '#has_won?' do
    let(:event_participant) { create(:event_participant) }
    let(:prize) { create(:prize, event: event_participant.event) }

    it 'returns false when participant has not won' do
      expect(event_participant.has_won?).to be false
    end

    it 'returns true when participant has won' do
      create(:winner, prize: prize, event_participant: event_participant)
      expect(event_participant.has_won?).to be true
    end
  end

  describe '#display_value' do
    let(:participant) { create(:participant, name: '王小明') }
    let(:event_participant) { create(:event_participant, participant: participant) }

    it 'delegates to participant display_value' do
      expect(event_participant.display_value('name', masked: true, privacy_settings: { 'name' => true })).to eq('王○明')
    end
  end

  # Phase 2 tests
  describe 'Phase 2 scopes' do
    describe '.with_min_seniority' do
      let(:event) { create(:event, event_date: Date.new(2026, 1, 15)) }
      let(:senior_participant) { create(:participant, hire_date: Date.new(2020, 1, 1)) }
      let(:junior_participant) { create(:participant, hire_date: Date.new(2024, 1, 1)) }
      let!(:senior_ep) { create(:event_participant, event: event, participant: senior_participant) }
      let!(:junior_ep) { create(:event_participant, event: event, participant: junior_participant) }

      it 'returns all when min_years is nil' do
        expect(event.event_participants.with_min_seniority(event, nil)).to include(senior_ep, junior_ep)
      end

      it 'returns all when min_years is 0' do
        expect(event.event_participants.with_min_seniority(event, 0)).to include(senior_ep, junior_ep)
      end

      it 'filters by minimum seniority' do
        result = event.event_participants.with_min_seniority(event, 3)
        expect(result).to include(senior_ep)
        expect(result).not_to include(junior_ep)
      end
    end

    describe '.in_departments' do
      let(:event) { create(:event) }
      let(:eng_participant) { create(:participant, department: '工程部') }
      let(:sales_participant) { create(:participant, department: '業務部') }
      let!(:eng_ep) { create(:event_participant, event: event, participant: eng_participant) }
      let!(:sales_ep) { create(:event_participant, event: event, participant: sales_participant) }

      it 'returns all when departments is empty' do
        expect(event.event_participants.in_departments([])).to include(eng_ep, sales_ep)
      end

      it 'filters by single department' do
        result = event.event_participants.in_departments(['工程部'])
        expect(result).to include(eng_ep)
        expect(result).not_to include(sales_ep)
      end

      it 'filters by multiple departments' do
        expect(event.event_participants.in_departments(['工程部', '業務部'])).to include(eng_ep, sales_ep)
      end
    end

    describe '.eligible_for with eligibility rules' do
      let(:event) { create(:event, event_date: Date.new(2026, 1, 15), allow_repeat_win: false) }
      let(:senior_eng) { create(:participant, hire_date: Date.new(2020, 1, 1), department: '工程部') }
      let(:junior_eng) { create(:participant, hire_date: Date.new(2024, 1, 1), department: '工程部') }
      let(:senior_sales) { create(:participant, hire_date: Date.new(2020, 1, 1), department: '業務部') }
      let!(:ep1) { create(:event_participant, event: event, participant: senior_eng) }
      let!(:ep2) { create(:event_participant, event: event, participant: junior_eng) }
      let!(:ep3) { create(:event_participant, event: event, participant: senior_sales) }

      it 'applies seniority filter from eligibility rules' do
        prize = create(:prize, event: event, eligibility_rules: { "min_seniority_years" => 3 })
        result = EventParticipant.eligible_for(prize)
        expect(result).to include(ep1, ep3)
        expect(result).not_to include(ep2)
      end

      it 'applies department filter from eligibility rules' do
        prize = create(:prize, event: event, eligibility_rules: { "departments" => ["工程部"] })
        result = EventParticipant.eligible_for(prize)
        expect(result).to include(ep1, ep2)
        expect(result).not_to include(ep3)
      end

      it 'applies both seniority and department filters' do
        prize = create(:prize, event: event, eligibility_rules: {
          "min_seniority_years" => 3,
          "departments" => ["工程部"]
        })
        result = EventParticipant.eligible_for(prize)
        expect(result).to include(ep1)
        expect(result).not_to include(ep2, ep3)
      end
    end
  end

  describe '#seniority_years (Phase 2)' do
    let(:event) { create(:event, event_date: Date.new(2026, 1, 15)) }
    let(:participant) { create(:participant, hire_date: Date.new(2020, 1, 1)) }
    let(:event_participant) { create(:event_participant, event: event, participant: participant) }

    it 'returns seniority years based on event date' do
      expect(event_participant.seniority_years).to eq(6)
    end
  end
end
