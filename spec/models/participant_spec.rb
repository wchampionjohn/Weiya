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

  # Phase 2 tests
  describe '#seniority_years_for (Phase 2)' do
    let(:event) { create(:event, event_date: Date.new(2026, 1, 15)) }

    it 'returns nil when hire_date is not set' do
      participant = create(:participant, hire_date: nil)
      expect(participant.seniority_years_for(event)).to be_nil
    end

    it 'calculates correct seniority years' do
      participant = create(:participant, hire_date: Date.new(2020, 1, 1))
      expect(participant.seniority_years_for(event)).to eq(6)
    end

    it 'rounds down partial years' do
      participant = create(:participant, hire_date: Date.new(2023, 6, 1))
      expect(participant.seniority_years_for(event)).to eq(2)
    end

    it 'returns 0 for recent hires' do
      participant = create(:participant, hire_date: Date.new(2025, 12, 1))
      expect(participant.seniority_years_for(event)).to eq(0)
    end
  end

  describe '#meets_seniority_requirement? (Phase 2)' do
    let(:event) { create(:event, event_date: Date.new(2026, 1, 15)) }
    let(:participant) { create(:participant, hire_date: Date.new(2020, 1, 1)) }

    it 'returns true when min_years is nil' do
      expect(participant.meets_seniority_requirement?(event, nil)).to be true
    end

    it 'returns true when min_years is 0' do
      expect(participant.meets_seniority_requirement?(event, 0)).to be true
    end

    it 'returns true when seniority meets requirement' do
      expect(participant.meets_seniority_requirement?(event, 5)).to be true
    end

    it 'returns false when seniority does not meet requirement' do
      expect(participant.meets_seniority_requirement?(event, 10)).to be false
    end
  end

  describe 'scopes (Phase 2)' do
    describe '.in_departments' do
      let!(:eng_participant) { create(:participant, department: '工程部') }
      let!(:sales_participant) { create(:participant, department: '業務部') }
      let!(:no_dept_participant) { create(:participant, department: nil) }

      it 'returns all when departments is empty' do
        expect(Participant.in_departments([])).to include(eng_participant, sales_participant, no_dept_participant)
      end

      it 'filters by single department' do
        expect(Participant.in_departments(['工程部'])).to include(eng_participant)
        expect(Participant.in_departments(['工程部'])).not_to include(sales_participant)
      end

      it 'filters by multiple departments' do
        expect(Participant.in_departments(['工程部', '業務部'])).to include(eng_participant, sales_participant)
        expect(Participant.in_departments(['工程部', '業務部'])).not_to include(no_dept_participant)
      end
    end
  end
end
