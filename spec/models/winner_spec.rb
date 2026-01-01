require 'rails_helper'

RSpec.describe Winner, type: :model do
  describe 'associations' do
    it { should belong_to(:prize) }
    it { should belong_to(:participant) }
  end

  describe 'validations' do
    it { should validate_presence_of(:prize_id) }
    it { should validate_presence_of(:participant_id) }
    it { should validate_presence_of(:drawn_at) }

    it 'validates uniqueness of participant per prize' do
      winner = create(:winner)
      duplicate = build(:winner, prize: winner.prize, participant: winner.participant)
      expect(duplicate).not_to be_valid
    end
  end

  describe 'scopes' do
    let!(:distributed_winner) { create(:winner, :distributed) }
    let!(:pending_winner) { create(:winner, distributed: false) }

    it '.distributed returns only distributed winners' do
      expect(Winner.distributed).to include(distributed_winner)
      expect(Winner.distributed).not_to include(pending_winner)
    end

    it '.pending returns only pending winners' do
      expect(Winner.pending).to include(pending_winner)
      expect(Winner.pending).not_to include(distributed_winner)
    end
  end

  describe '#mark_distributed!' do
    let(:winner) { create(:winner) }
    let(:admin) { create(:admin) }

    it 'marks winner as distributed' do
      winner.mark_distributed!(admin)
      expect(winner.distributed).to be true
      expect(winner.distributed_at).to be_present
      expect(winner.distributed_by).to eq(admin.id)
    end
  end
end
