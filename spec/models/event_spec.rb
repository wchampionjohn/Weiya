require 'rails_helper'

RSpec.describe Event, type: :model do
  describe 'associations' do
    it { should have_many(:prizes).dependent(:destroy) }
    it { should have_many(:event_participants).dependent(:destroy) }
    it { should have_many(:participants).through(:event_participants) }
    it { should have_many(:winners).through(:prizes) }
  end

  describe 'validations' do
    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:event_date) }

    it 'requires at least one required field' do
      event = build(:event, required_fields: [])
      expect(event).not_to be_valid
      expect(event.errors[:required_fields]).to include('必須至少選擇一個必填欄位')
    end

    it 'validates uniqueness of public_slug' do
      create(:event, public_slug: 'abc123')
      event = build(:event, public_slug: 'abc123')
      expect(event).not_to be_valid
    end

    it 'allows nil public_slug' do
      create(:event, public_slug: 'abc123')
      event = build(:event, public_slug: nil)
      expect(event).to be_valid
    end
  end

  describe 'enums' do
    it { should define_enum_for(:status).with_values(draft: 0, active: 1, completed: 2) }
  end

  describe 'scopes' do
    let!(:draft_event) { create(:event, status: :draft) }
    let!(:active_event) { create(:event, status: :active) }
    let!(:completed_event) { create(:event, status: :completed) }

    describe '.active_or_completed' do
      it 'returns active and completed events' do
        expect(Event.active_or_completed).to include(active_event, completed_event)
        expect(Event.active_or_completed).not_to include(draft_event)
      end
    end

    describe '.published' do
      it 'returns non-draft events' do
        expect(Event.published).to include(active_event, completed_event)
        expect(Event.published).not_to include(draft_event)
      end
    end
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

  describe '#allow_repeat_win_for_prize?' do
    let(:event) { create(:event, allow_repeat_win: false) }
    let(:prize) { create(:prize, event: event) }

    it 'returns event setting when prize has no override' do
      expect(event.allow_repeat_win_for_prize?(prize)).to be false
    end

    it 'returns prize override when set' do
      prize.update!(allow_repeat_win_override: true)
      expect(event.allow_repeat_win_for_prize?(prize)).to be true
    end
  end

  describe '#has_password?' do
    it 'returns true when password is set' do
      event = build(:event, password: 'secret123')
      expect(event.has_password?).to be true
    end

    it 'returns false when password is blank' do
      event = build(:event, password: nil)
      expect(event.has_password?).to be false
    end
  end

  describe '#generate_slug!' do
    let(:event) { create(:event) }

    it 'generates a random slug' do
      event.generate_slug!
      expect(event.public_slug).to be_present
      expect(event.public_slug.length).to eq(12)
    end

    it 'ensures slug is unique' do
      allow(SecureRandom).to receive(:alphanumeric).and_return('duplicate123', 'unique12345x')
      create(:event, public_slug: 'duplicate123')
      event.generate_slug!
      expect(event.public_slug).to eq('unique12345x')
    end
  end

  describe '#clear_slug!' do
    let(:event) { create(:event, public_slug: 'abc123') }

    it 'clears the slug' do
      event.clear_slug!
      expect(event.public_slug).to be_nil
    end
  end

  describe '#public_identifier' do
    it 'returns slug when present' do
      event = build(:event, public_slug: 'abc123')
      expect(event.public_identifier).to eq('abc123')
    end

    it 'returns id when slug is blank' do
      event = create(:event, public_slug: nil)
      expect(event.public_identifier).to eq(event.id)
    end
  end

  describe '#use_random_url?' do
    it 'returns true when slug is present' do
      event = build(:event, public_slug: 'abc123')
      expect(event.use_random_url?).to be true
    end

    it 'returns false when slug is blank' do
      event = build(:event, public_slug: nil)
      expect(event.use_random_url?).to be false
    end
  end

  describe '.find_by_slug_or_id' do
    let!(:event) { create(:event, public_slug: 'abc123') }

    it 'finds by slug' do
      expect(Event.find_by_slug_or_id('abc123')).to eq(event)
    end

    it 'finds by id when slug not found' do
      expect(Event.find_by_slug_or_id(event.id.to_s)).to eq(event)
    end

    it 'returns nil when not found' do
      expect(Event.find_by_slug_or_id('nonexistent')).to be_nil
    end
  end

  describe '#participants_count' do
    let(:event) { create(:event) }

    it 'returns the count of event participants' do
      create_list(:event_participant, 3, event: event)
      expect(event.participants_count).to eq(3)
    end
  end

  describe '#prizes_count' do
    let(:event) { create(:event) }

    it 'returns the count of prizes' do
      create_list(:prize, 2, event: event)
      expect(event.prizes_count).to eq(2)
    end
  end
end
