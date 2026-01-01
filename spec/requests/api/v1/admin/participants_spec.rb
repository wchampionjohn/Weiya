require 'rails_helper'

RSpec.describe 'Api::V1::Admin::Participants', type: :request do
  let(:admin) { create(:admin) }
  let(:event) { create(:event) }

  before do
    post '/api/v1/admin/session', params: { email: admin.email, password: 'password123' }
  end

  describe 'GET /api/v1/admin/events/:event_id/participants' do
    let!(:participants) { create_list(:participant, 3, event: event) }

    it 'returns all participants' do
      get "/api/v1/admin/events/#{event.id}/participants"
      expect(response).to have_http_status(:success)
      expect(json_response.size).to eq(3)
    end
  end

  describe 'POST /api/v1/admin/events/:event_id/participants' do
    let(:valid_params) do
      {
        participant: {
          name: 'John Doe',
          employee_id: 'E001',
          phone: '0912345678',
          email: 'john@example.com'
        }
      }
    end

    it 'creates a participant' do
      expect {
        post "/api/v1/admin/events/#{event.id}/participants", params: valid_params
      }.to change(Participant, :count).by(1)

      expect(response).to have_http_status(:created)
    end
  end

  def json_response
    JSON.parse(response.body)
  end
end
