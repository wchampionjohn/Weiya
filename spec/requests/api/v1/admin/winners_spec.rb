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

end
