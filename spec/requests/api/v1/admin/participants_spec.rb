require 'rails_helper'

RSpec.describe 'Api::V1::Admin::Participants', type: :request do
  let(:admin) { create(:admin) }
  let(:event) { create(:event) }

  before do
    post '/api/v1/admin/session', params: { email: admin.email, password: 'password123' }
  end

  describe 'GET /api/v1/admin/participants' do
    let!(:participants) { create_list(:participant, 3) }

    it 'returns all global participants' do
      get '/api/v1/admin/participants'
      expect(response).to have_http_status(:success)
      expect(json_response.size).to eq(3)
    end

    it 'searches participants by query' do
      create(:participant, name: '王小明')
      get '/api/v1/admin/participants', params: { q: '王小明' }
      expect(response).to have_http_status(:success)
      expect(json_response.size).to eq(1)
    end
  end

  describe 'GET /api/v1/admin/participants/:id' do
    let(:participant) { create(:participant) }

    it 'returns participant details' do
      get "/api/v1/admin/participants/#{participant.id}"
      expect(response).to have_http_status(:success)
      expect(json_response['name']).to eq(participant.name)
    end
  end

  describe 'POST /api/v1/admin/participants' do
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

    it 'creates a global participant' do
      expect {
        post '/api/v1/admin/participants', params: valid_params
      }.to change(Participant, :count).by(1)

      expect(response).to have_http_status(:created)
    end

    it 'returns validation errors for duplicate employee_id' do
      create(:participant, employee_id: 'E001')
      post '/api/v1/admin/participants', params: valid_params
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe 'PATCH /api/v1/admin/participants/:id' do
    let(:participant) { create(:participant) }

    it 'updates the participant' do
      patch "/api/v1/admin/participants/#{participant.id}", params: { participant: { name: 'Updated Name' } }
      expect(response).to have_http_status(:success)
      expect(participant.reload.name).to eq('Updated Name')
    end
  end

  describe 'DELETE /api/v1/admin/participants/:id' do
    let!(:participant) { create(:participant) }

    it 'deletes the participant' do
      expect {
        delete "/api/v1/admin/participants/#{participant.id}"
      }.to change(Participant, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end

    it 'forbids deletion if participant has wins' do
      event_participant = create(:event_participant, participant: participant)
      create(:winner, event_participant: event_participant)
      delete "/api/v1/admin/participants/#{participant.id}"
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe 'GET /api/v1/admin/events/:event_id/participants' do
    let!(:event_participants) do
      participants = create_list(:participant, 3)
      participants.map { |p| create(:event_participant, event: event, participant: p) }
    end

    it 'returns event participants' do
      get "/api/v1/admin/events/#{event.id}/participants"
      expect(response).to have_http_status(:success)
      expect(json_response.size).to eq(3)
    end
  end

  describe 'POST /api/v1/admin/events/:event_id/participants/:id/add' do
    let(:participant) { create(:participant) }

    it 'adds participant to event' do
      expect {
        post "/api/v1/admin/events/#{event.id}/participants/#{participant.id}/add"
      }.to change(EventParticipant, :count).by(1)

      expect(response).to have_http_status(:created)
    end

    it 'returns error if already added' do
      create(:event_participant, event: event, participant: participant)
      post "/api/v1/admin/events/#{event.id}/participants/#{participant.id}/add"
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe 'DELETE /api/v1/admin/events/:event_id/participants/:id/remove' do
    let(:participant) { create(:participant) }
    let!(:event_participant) { create(:event_participant, event: event, participant: participant) }

    it 'removes participant from event' do
      expect {
        delete "/api/v1/admin/events/#{event.id}/participants/#{participant.id}/remove"
      }.to change(EventParticipant, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end

    it 'forbids removal if participant has wins in event' do
      prize = create(:prize, event: event)
      create(:winner, prize: prize, event_participant: event_participant)
      delete "/api/v1/admin/events/#{event.id}/participants/#{participant.id}/remove"
      expect(response).to have_http_status(:forbidden)
    end
  end

end
