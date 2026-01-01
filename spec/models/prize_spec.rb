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
end
