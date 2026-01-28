require 'rails_helper'

RSpec.describe 'Api::V1::Admin::Winners', type: :request do
  let(:admin) { create(:admin) }
  let(:event) { create(:event) }
  let(:prize) { create(:prize, event: event) }
  let(:event_participant) { create(:event_participant, event: event) }
  let!(:winner) { create(:winner, prize: prize, event_participant: event_participant) }

  before do
    post '/api/v1/admin/session', params: { email: admin.email, password: 'password123' }
  end

  describe 'GET /api/v1/admin/winners' do
    it 'returns all winners' do
      get '/api/v1/admin/winners', params: { event_id: event.id }
      expect(response).to have_http_status(:success)
      expect(json_response.size).to eq(1)
    end

    it 'includes winner details' do
      get '/api/v1/admin/winners', params: { event_id: event.id }
      winner_data = json_response.first
      expect(winner_data['prize']).to be_present
      expect(winner_data['participant']).to be_present
    end
  end

  describe 'PATCH /api/v1/admin/winners/:id' do
    it 'marks winner as distributed' do
      patch "/api/v1/admin/winners/#{winner.id}", params: { distributed: true }
      expect(response).to have_http_status(:success)
      expect(winner.reload.distributed).to be true
      expect(winner.distributed_by).to eq(admin.id)
    end
  end

  # Phase 2: Batch distribute
  describe 'POST /api/v1/admin/winners/batch_distribute' do
    let(:participants) { create_list(:participant, 3) }
    let!(:event_participants) do
      participants.map { |p| create(:event_participant, event: event, participant: p) }
    end
    let!(:winners) do
      event_participants.map { |ep| create(:winner, prize: prize, event_participant: ep) }
    end

    it 'distributes multiple winners' do
      post '/api/v1/admin/winners/batch_distribute', params: { winner_ids: winners.map(&:id) }

      expect(response).to have_http_status(:success)
      expect(json_response['distributed_count']).to eq(3)
      expect(json_response['skipped_count']).to eq(0)
      expect(json_response['winners'].length).to eq(3)

      winners.each do |w|
        expect(w.reload.distributed?).to be true
      end
    end

    it 'skips already distributed winners' do
      winners.first.update!(distributed: true, distributed_at: 1.day.ago)

      post '/api/v1/admin/winners/batch_distribute', params: { winner_ids: winners.map(&:id) }

      expect(response).to have_http_status(:success)
      expect(json_response['distributed_count']).to eq(2)
      expect(json_response['skipped_count']).to eq(1)
    end

    it 'returns error when no winner_ids provided' do
      post '/api/v1/admin/winners/batch_distribute', params: { winner_ids: [] }

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response['error']).to eq('請選擇至少一筆中獎記錄')
    end

    it 'handles partial winner IDs' do
      post '/api/v1/admin/winners/batch_distribute', params: { winner_ids: [winners.first.id, winners.second.id] }

      expect(response).to have_http_status(:success)
      expect(json_response['distributed_count']).to eq(2)
      expect(winners.third.reload.distributed?).to be false
    end

    context 'with notification options' do
      before do
        participants[0].update!(phone: '0912345678', email: 'test1@example.com')
        participants[1].update!(phone: '0923456789', email: nil)
        participants[2].update!(phone: nil, email: 'test3@example.com')
      end

      it 'returns notification counts when sending SMS' do
        post '/api/v1/admin/winners/batch_distribute', params: {
          winner_ids: winners.map(&:id),
          send_sms: true,
          sms_template: '恭喜 {name}！您獲得 {prize}'
        }

        expect(response).to have_http_status(:success)
        expect(json_response['distributed_count']).to eq(3)
        expect(json_response['sms_sent_count']).to eq(2)
        expect(json_response['email_sent_count']).to eq(0)
      end

      it 'returns notification counts when sending both SMS and Email' do
        post '/api/v1/admin/winners/batch_distribute', params: {
          winner_ids: winners.map(&:id),
          send_sms: true,
          send_email: true,
          sms_template: '恭喜！',
          email_template: '恭喜您中獎！'
        }

        expect(response).to have_http_status(:success)
        expect(json_response['sms_sent_count']).to eq(2)
        expect(json_response['email_sent_count']).to eq(2)
      end
    end
  end

end
