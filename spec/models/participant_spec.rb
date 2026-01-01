require 'rails_helper'

RSpec.describe Participant, type: :model do
  describe 'associations' do
    it { should belong_to(:event) }
    it { should have_many(:winners).dependent(:destroy) }
  end

  describe 'validations' do
    let(:event) { create(:event, required_fields: ['name', 'employee_id']) }

    it 'validates required fields from event' do
      participant = build(:participant, event: event, name: nil)
      expect(participant).not_to be_valid
      expect(participant.errors[:name]).to include('is required')
    end

    it 'validates uniqueness of required fields' do
      create(:participant, event: event, employee_id: 'E001')
      participant = build(:participant, event: event, employee_id: 'E001')
      expect(participant).not_to be_valid
      expect(participant.errors[:employee_id]).to include('has already been taken')
    end
  end

  describe 'scopes' do
    describe '.eligible_for' do
      let(:event) { create(:event, allow_repeat_win: false) }
      let(:prize) { create(:prize, event: event) }
      let!(:participant1) { create(:participant, event: event) }
      let!(:participant2) { create(:participant, event: event) }

      it 'excludes participants who already won' do
        create(:winner, prize: prize, participant: participant1)
        eligible = Participant.eligible_for(prize)
        expect(eligible).to include(participant2)
        expect(eligible).not_to include(participant1)
      end

      it 'includes all when repeat wins allowed' do
        event.update!(allow_repeat_win: true)
        create(:winner, prize: prize, participant: participant1)
        expect(Participant.eligible_for(prize)).to include(participant1, participant2)
      end
    end
  end
end
