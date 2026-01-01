require 'rails_helper'

RSpec.describe Participant, type: :model do
  describe 'associations' do
    it { should have_many(:event_participants).dependent(:destroy) }
    it { should have_many(:events).through(:event_participants) }
    it { should have_many(:winners).through(:event_participants) }
  end

  describe 'validations' do
    it { should validate_presence_of(:name) }

    it 'validates uniqueness of employee_id' do
      create(:participant, employee_id: 'E001')
      participant = build(:participant, employee_id: 'E001')
      expect(participant).not_to be_valid
      expect(participant.errors[:employee_id]).to include('已存在')
    end

    it 'allows nil employee_id' do
      participant = build(:participant, employee_id: nil)
      expect(participant).to be_valid
    end

    it 'validates uniqueness of phone' do
      create(:participant, phone: '0912345678')
      participant = build(:participant, phone: '0912345678')
      expect(participant).not_to be_valid
      expect(participant.errors[:phone]).to include('已存在')
    end

    it 'validates uniqueness of email' do
      create(:participant, email: 'test@example.com')
      participant = build(:participant, email: 'test@example.com')
      expect(participant).not_to be_valid
      expect(participant.errors[:email]).to include('已存在')
    end

    it 'validates email format' do
      participant = build(:participant, email: 'invalid-email')
      expect(participant).not_to be_valid
    end

    it 'allows blank email' do
      participant = build(:participant, email: nil)
      expect(participant).to be_valid
    end
  end

  describe 'scopes' do
    describe '.search' do
      let!(:participant1) { create(:participant, name: '王小明', employee_id: 'E001') }
      let!(:participant2) { create(:participant, name: '李大華', phone: '0912345678') }

      it 'searches by name' do
        expect(Participant.search('王小明')).to include(participant1)
        expect(Participant.search('王小明')).not_to include(participant2)
      end

      it 'searches by employee_id' do
        expect(Participant.search('E001')).to include(participant1)
      end

      it 'searches by phone' do
        expect(Participant.search('0912345678')).to include(participant2)
      end

      it 'returns all when query is blank' do
        expect(Participant.search('')).to include(participant1, participant2)
      end
    end
  end

  describe '#display_value' do
    let(:participant) { create(:participant, name: '王小明', phone: '0912345678') }

    it 'returns the field value without masking' do
      expect(participant.display_value('name')).to eq('王小明')
    end

    it 'returns masked value when privacy settings enabled' do
      expect(participant.display_value('name', masked: true, privacy_settings: { 'name' => true })).to eq('王○明')
    end

    it 'returns unmasked value when privacy settings disabled' do
      expect(participant.display_value('name', masked: true, privacy_settings: { 'name' => false })).to eq('王小明')
    end
  end

  describe '#events_count' do
    let(:participant) { create(:participant) }
    let(:event1) { create(:event) }
    let(:event2) { create(:event) }

    it 'returns the number of events the participant belongs to' do
      create(:event_participant, event: event1, participant: participant)
      create(:event_participant, event: event2, participant: participant)
      expect(participant.events_count).to eq(2)
    end
  end
end
