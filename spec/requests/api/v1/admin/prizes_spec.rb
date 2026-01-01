require 'rails_helper'

RSpec.describe 'Api::V1::Admin::Prizes', type: :request do
  let(:admin) { create(:admin) }
  let(:event) { create(:event) }

  before do
    post '/api/v1/admin/session', params: { email: admin.email, password: 'password123' }
  end

  describe 'POST /api/v1/admin/events/:event_id/prizes' do
    let(:valid_params) do
      {
        prize: {
          name: 'Grand Prize',
          prize_type: 'gift',
          value: 10000,
          quantity: 1,
          position: 1
        }
      }
    end

    it 'creates a prize' do
      expect {
        post "/api/v1/admin/events/#{event.id}/prizes", params: valid_params
      }.to change(Prize, :count).by(1)

      expect(response).to have_http_status(:created)
    end
  end

  describe 'DELETE /api/v1/admin/events/:event_id/prizes/:id' do
    let!(:prize) { create(:prize, event: event) }

    it 'deletes the prize' do
      expect {
        delete "/api/v1/admin/events/#{event.id}/prizes/#{prize.id}"
      }.to change(Prize, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end
  end

  def json_response
    JSON.parse(response.body)
  end
end
