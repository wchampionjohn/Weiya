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

  describe 'GET /api/v1/admin/events/:id' do
    let(:event) { create(:event) }

    it 'returns event details' do
      get "/api/v1/admin/events/#{event.id}"
      expect(response).to have_http_status(:success)
      expect(json_response['name']).to eq(event.name)
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

    it 'returns validation errors for invalid params' do
      post '/api/v1/admin/events', params: { event: { name: '' } }
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe 'PATCH /api/v1/admin/events/:id' do
    let(:event) { create(:event) }

    it 'updates the event' do
      patch "/api/v1/admin/events/#{event.id}", params: { event: { name: 'Updated Name' } }
      expect(response).to have_http_status(:success)
      expect(event.reload.name).to eq('Updated Name')
    end
  end

  describe 'DELETE /api/v1/admin/events/:id' do
    let!(:event) { create(:event) }

    it 'deletes the event' do
      expect {
        delete "/api/v1/admin/events/#{event.id}"
      }.to change(Event, :count).by(-1)

      expect(response).to have_http_status(:no_content)
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

  describe 'POST /api/v1/admin/events/:id/generate_slug' do
    let(:event) { create(:event, public_slug: nil) }

    it 'generates a random slug' do
      post "/api/v1/admin/events/#{event.id}/generate_slug"
      expect(response).to have_http_status(:success)
      expect(event.reload.public_slug).to be_present
    end
  end

  describe 'DELETE /api/v1/admin/events/:id/clear_slug' do
    let(:event) { create(:event, public_slug: 'abc123') }

    it 'clears the slug' do
      delete "/api/v1/admin/events/#{event.id}/clear_slug"
      expect(response).to have_http_status(:success)
      expect(event.reload.public_slug).to be_nil
    end
  end

end
