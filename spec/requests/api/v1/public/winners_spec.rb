require 'rails_helper'

RSpec.describe 'Api::V1::Public::Winners', type: :request do
  let(:event) { create(:event, :active) }
  let(:prize) { create(:prize, :drawn, event: event, display_fields: ['name'], privacy_settings: { 'name' => true }) }
  let!(:winners) do
    participants = create_list(:participant, 3, name: '王小明')
    participants.map do |p|
      ep = create(:event_participant, event: event, participant: p)
      create(:winner, prize: prize, event_participant: ep)
    end
  end

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
      expect(winner_data['display_data']['name']).to eq('王○明')
    end

    it 'includes prize information' do
      get "/api/v1/public/events/#{event.id}/winners"
      winner_data = json_response.first
      expect(winner_data['prize']).to be_present
      expect(winner_data['prize']['name']).to eq(prize.name)
    end

    context 'when event is draft' do
      let(:event) { create(:event, status: :draft) }

      it 'returns not found' do
        get "/api/v1/public/events/#{event.id}/winners"
        expect(response).to have_http_status(:not_found)
      end
    end
  end

end
