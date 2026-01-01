require 'rails_helper'

RSpec.describe 'Api::V1::Admin::Events', type: :request do
  let(:admin) { create(:admin) }

  before do
    post '/api/v1/admin/session', params: { email: admin.email, password: 'password123' }
  end

  describe 'GET /api/v1/admin/events' do
    let!(:events) { create_list(:event, 3) }

    it 'returns all events' do
      get '/api/v1/admin/events'
      expect(response).to have_http_status(:success)
      expect(json_response.size).to eq(3)
    end
  end

  describe 'POST /api/v1/admin/events' do
    let(:valid_params) do
      {
        event: {
          name: 'Test Event',
          event_date: 1.week.from_now,
          required_fields: ['name']
        }
      }
    end

    it 'creates an event' do
      expect {
        post '/api/v1/admin/events', params: valid_params
      }.to change(Event, :count).by(1)

      expect(response).to have_http_status(:created)
    end
  end

  describe 'POST /api/v1/admin/events/:id/publish' do
    let(:event) { create(:event, status: :draft) }

    it 'publishes the event' do
      post "/api/v1/admin/events/#{event.id}/publish"
      expect(response).to have_http_status(:success)
      expect(event.reload.status).to eq('active')
    end
  end

  def json_response
    JSON.parse(response.body)
  end
end
