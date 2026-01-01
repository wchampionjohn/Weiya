require 'rails_helper'

RSpec.describe Event, type: :model do
  describe 'associations' do
    it { should have_many(:prizes).dependent(:destroy) }
    it { should have_many(:participants).dependent(:destroy) }
    it { should have_many(:winners).through(:prizes) }
  end

  describe 'validations' do
    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:event_date) }

    it 'requires at least one required field' do
      event = build(:event, required_fields: [])
      expect(event).not_to be_valid
      expect(event.errors[:required_fields]).to include('must have at least one field')
    end
  end

  describe 'enums' do
    it { should define_enum_for(:status).with_values(draft: 0, active: 1, completed: 2) }
  end

  describe '#editable?' do
    it 'returns true for draft events' do
      event = build(:event, status: :draft)
      expect(event.editable?).to be true
    end

    it 'returns false for active events' do
      event = build(:event, status: :active)
      expect(event.editable?).to be false
    end
  end

  describe '#can_modify_prize?' do
    let(:event) { create(:event) }
    let(:prize) { create(:prize, event: event) }

    it 'allows modification for draft events' do
      expect(event.can_modify_prize?(prize)).to be true
    end

    it 'allows modification for undrawn prizes in active events' do
      event.update!(status: :active)
      expect(event.can_modify_prize?(prize)).to be true
    end

    it 'does not allow modification for drawn prizes' do
      event.update!(status: :active)
      prize.update!(drawn: true)
      expect(event.can_modify_prize?(prize)).to be false
    end
  end
end
