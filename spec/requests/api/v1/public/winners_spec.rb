require 'rails_helper'

RSpec.describe 'Api::V1::Public::Winners', type: :request do
  let(:event) { create(:event, :active) }
  let(:prize) { create(:prize, :drawn, event: event) }
  let!(:winners) { create_list(:winner, 3, prize: prize) }

  describe 'GET /api/v1/public/events/:event_id/winners' do
    it 'returns all winners' do
      get "/api/v1/public/events/#{event.id}/winners"
      expect(response).to have_http_status(:success)
      expect(json_response.size).to eq(3)
    end

    it 'includes masked display data' do
      get "/api/v1/public/events/#{event.id}/winners"
      winner_data = json_response.first
      expect(winner_data['display_data']).to be_present
    end
  end

  def json_response
    JSON.parse(response.body)
  end
end
