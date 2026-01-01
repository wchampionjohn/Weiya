require 'rails_helper'

RSpec.describe 'Api::V1::Admin::Draws', type: :request do
  let(:admin) { create(:admin) }
  let(:event) { create(:event, :active) }
  let(:prize) { create(:prize, event: event, quantity: 2) }
  let!(:event_participants) do
    participants = create_list(:participant, 5)
    participants.map { |p| create(:event_participant, event: event, participant: p) }
  end

  before do
    post '/api/v1/admin/session', params: { email: admin.email, password: 'password123' }
  end

  describe 'POST /api/v1/admin/prizes/:prize_id/draw' do
    it 'executes the draw' do
      expect {
        post "/api/v1/admin/prizes/#{prize.id}/draw"
      }.to change(Winner, :count).by(2)

      expect(response).to have_http_status(:success)
      expect(json_response['winners'].size).to eq(2)
    end

    it 'draws specified count' do
      post "/api/v1/admin/prizes/#{prize.id}/draw", params: { count: 1 }
      expect(json_response['winners'].size).to eq(1)
    end

    it 'returns winner display data' do
      post "/api/v1/admin/prizes/#{prize.id}/draw"
      winner = json_response['winners'].first
      expect(winner['display_data']).to be_present
    end

    context 'when prize already drawn' do
      before { prize.update!(drawn: true) }

      it 'returns error' do
        post "/api/v1/admin/prizes/#{prize.id}/draw"
        expect(response).to have_http_status(:forbidden)
      end
    end

    context 'when no eligible participants' do
      before { event_participants.each(&:destroy) }

      it 'returns error' do
        post "/api/v1/admin/prizes/#{prize.id}/draw"
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

end
