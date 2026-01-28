require 'rails_helper'

RSpec.describe Prize, type: :model do
  describe 'associations' do
    it { should belong_to(:event) }
    it { should have_many(:winners).dependent(:destroy) }
  end

  describe 'validations' do
    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:value) }
    it { should validate_numericality_of(:value).is_greater_than_or_equal_to(0) }
    it { should validate_presence_of(:quantity) }
    it { should validate_numericality_of(:quantity).is_greater_than(0) }
    it { should validate_presence_of(:prize_type) }
    it { should validate_presence_of(:position) }
  end

  describe 'enums' do
    it { should define_enum_for(:prize_type).with_values(cash: 0, gift: 1) }
  end

  describe 'scopes' do
    let(:event) { create(:event) }
    let!(:undrawn_prize) { create(:prize, event: event, drawn: false) }
    let!(:drawn_prize) { create(:prize, event: event, drawn: true) }

    it '.undrawn returns only undrawn prizes' do
      expect(Prize.undrawn).to include(undrawn_prize)
      expect(Prize.undrawn).not_to include(drawn_prize)
    end

    it '.drawn returns only drawn prizes' do
      expect(Prize.drawn).to include(drawn_prize)
      expect(Prize.drawn).not_to include(undrawn_prize)
    end
  end

  describe 'callbacks' do
    it 'sets taxable to true for cash prizes' do
      prize = create(:prize, prize_type: :cash, taxable: false)
      expect(prize.taxable).to be true
    end
  end

  describe '#remaining_quantity' do
    let(:prize) { create(:prize, quantity: 3) }

    it 'returns remaining quantity' do
      expect(prize.remaining_quantity).to eq(3)
    end

    it 'subtracts winner count' do
      create(:winner, prize: prize)
      expect(prize.remaining_quantity).to eq(2)
    end
  end

  # Phase 2 tests
  describe 'Phase 2 scopes' do
    let(:event) { create(:event) }
    let!(:regular_prize) { create(:prize, event: event, is_bonus: false) }
    let!(:bonus_prize) { create(:prize, event: event, is_bonus: true) }

    describe '.bonus' do
      it 'returns only bonus prizes' do
        expect(Prize.bonus).to include(bonus_prize)
        expect(Prize.bonus).not_to include(regular_prize)
      end
    end

    describe '.regular' do
      it 'returns only regular prizes' do
        expect(Prize.regular).to include(regular_prize)
        expect(Prize.regular).not_to include(bonus_prize)
      end
    end
  end

  describe '#has_designated_participant? (Phase 2)' do
    let(:event) { create(:event) }
    let(:participant) { create(:participant) }

    it 'returns false when no designated participant' do
      prize = create(:prize, event: event, designated_participant_id: nil)
      expect(prize.has_designated_participant?).to be false
    end

    it 'returns true when designated participant is set' do
      prize = create(:prize, event: event, designated_participant_id: participant.id)
      expect(prize.has_designated_participant?).to be true
    end
  end

  describe '#has_eligibility_rules? (Phase 2)' do
    let(:event) { create(:event) }

    it 'returns false when eligibility_rules is nil' do
      prize = create(:prize, event: event, eligibility_rules: nil)
      expect(prize.has_eligibility_rules?).to be false
    end

    it 'returns false when eligibility_rules is empty' do
      prize = create(:prize, event: event, eligibility_rules: {})
      expect(prize.has_eligibility_rules?).to be false
    end

    it 'returns true when eligibility_rules has values' do
      prize = create(:prize, event: event, eligibility_rules: { "min_seniority_years" => 3 })
      expect(prize.has_eligibility_rules?).to be true
    end
  end

  describe '#min_seniority_years (Phase 2)' do
    let(:event) { create(:event) }

    it 'returns nil when not set' do
      prize = create(:prize, event: event, eligibility_rules: nil)
      expect(prize.min_seniority_years).to be_nil
    end

    it 'returns the value when set' do
      prize = create(:prize, event: event, eligibility_rules: { "min_seniority_years" => 5 })
      expect(prize.min_seniority_years).to eq(5)
    end
  end

  describe '#required_departments (Phase 2)' do
    let(:event) { create(:event) }

    it 'returns empty array when not set' do
      prize = create(:prize, event: event, eligibility_rules: nil)
      expect(prize.required_departments).to eq([])
    end

    it 'returns departments when set' do
      prize = create(:prize, event: event, eligibility_rules: { "departments" => ["工程部", "業務部"] })
      expect(prize.required_departments).to eq(["工程部", "業務部"])
    end
  end

  describe '#insert_after_latest_drawn (Phase 2)' do
    let(:event) { create(:event) }

    it 'sets position after latest drawn prize' do
      create(:prize, event: event, position: 1, drawn: true, drawn_at: 1.hour.ago)
      create(:prize, event: event, position: 2, drawn: true, drawn_at: Time.current)
      create(:prize, event: event, position: 3, drawn: false)

      new_prize = build(:prize, event: event, is_bonus: true)
      new_prize.insert_after_latest_drawn

      expect(new_prize.position).to eq(3)
    end

    it 'sets position at end when no prizes are drawn' do
      create(:prize, event: event, position: 1, drawn: false)
      create(:prize, event: event, position: 2, drawn: false)

      new_prize = build(:prize, event: event, is_bonus: true)
      new_prize.insert_after_latest_drawn

      expect(new_prize.position).to eq(3)
    end
  end
end
