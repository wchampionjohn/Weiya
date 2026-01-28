require 'rails_helper'

RSpec.describe Winner, type: :model do
  describe 'associations' do
    it { should belong_to(:prize) }
    it { should belong_to(:event_participant) }
    it { should have_one(:participant).through(:event_participant) }
  end

  describe 'validations' do
    it { should validate_presence_of(:prize_id) }
    it { should validate_presence_of(:event_participant_id) }
    it { should validate_presence_of(:drawn_at) }

    it 'validates uniqueness of event_participant per prize' do
      winner = create(:winner)
      duplicate = build(:winner, prize: winner.prize, event_participant: winner.event_participant)
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:event_participant_id]).to include('已獲得此獎項')
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

  describe 'delegated methods' do
    let(:participant) { create(:participant, name: '王小明', employee_id: 'E001', phone: '0912345678', email: 'test@example.com') }
    let(:event) { create(:event) }
    let(:event_participant) { create(:event_participant, event: event, participant: participant) }
    let(:prize) { create(:prize, event: event) }
    let(:winner) { create(:winner, prize: prize, event_participant: event_participant) }

    it 'delegates name to event_participant' do
      expect(winner.name).to eq('王小明')
    end

    it 'delegates employee_id to event_participant' do
      expect(winner.employee_id).to eq('E001')
    end

    it 'delegates phone to event_participant' do
      expect(winner.phone).to eq('0912345678')
    end

    it 'delegates email to event_participant' do
      expect(winner.email).to eq('test@example.com')
    end

    it 'delegates event to prize' do
      expect(winner.event).to eq(event)
    end
  end

  describe '#display_data' do
    let(:participant) { create(:participant, name: '王小明', phone: '0912345678') }
    let(:event) { create(:event) }
    let(:event_participant) { create(:event_participant, event: event, participant: participant) }
    let(:prize) { create(:prize, event: event, display_fields: ['name', 'phone'], privacy_settings: { 'name' => true, 'phone' => false }) }
    let(:winner) { create(:winner, prize: prize, event_participant: event_participant) }

    it 'returns display data with privacy settings applied' do
      data = winner.display_data(masked: true)
      expect(data['name']).to eq('王○明')
      expect(data['phone']).to eq('0912345678')
    end

    it 'returns unmasked data when masked is false' do
      data = winner.display_data(masked: false)
      expect(data['name']).to eq('王小明')
      expect(data['phone']).to eq('0912345678')
    end
  end
end
