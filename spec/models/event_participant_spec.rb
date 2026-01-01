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
end
