require 'rails_helper'

RSpec.describe 'Api::V1::Public::Sessions', type: :request do
  let(:event) { create(:event, :active, required_fields: ['employee_id']) }
  let(:participant) { create(:participant, employee_id: 'E001') }
  let!(:event_participant) { create(:event_participant, event: event, participant: participant) }

  describe 'POST /api/v1/public/session' do
    context 'with valid credentials' do
      it 'returns participant info' do
        post '/api/v1/public/session', params: {
          event_id: event.id,
          field: 'employee_id',
          value: 'E001'
        }
        expect(response).to have_http_status(:success)
        expect(json_response['participant']['id']).to eq(participant.id)
        expect(json_response['participant']['name']).to eq(participant.name)
      end

      it 'returns participant wins' do
        prize = create(:prize, event: event)
        create(:winner, prize: prize, event_participant: event_participant)

        post '/api/v1/public/session', params: {
          event_id: event.id,
          field: 'employee_id',
          value: 'E001'
        }
        expect(json_response['wins'].size).to eq(1)
      end
    end

    context 'with invalid credentials' do
      it 'returns not found' do
        post '/api/v1/public/session', params: {
          event_id: event.id,
          field: 'employee_id',
          value: 'INVALID'
        }
        expect(response).to have_http_status(:not_found)
      end
    end

    context 'with invalid field' do
      it 'returns bad request' do
        post '/api/v1/public/session', params: {
          event_id: event.id,
          field: 'invalid_field',
          value: 'test'
        }
        expect(response).to have_http_status(:bad_request)
      end
    end

    context 'when participant not in event' do
      let(:other_event) { create(:event, :active, required_fields: ['employee_id']) }

      it 'returns not found' do
        post '/api/v1/public/session', params: {
          event_id: other_event.id,
          field: 'employee_id',
          value: 'E001'
        }
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'DELETE /api/v1/public/session' do
    it 'logs out successfully' do
      delete '/api/v1/public/session'
      expect(response).to have_http_status(:success)
      expect(json_response['message']).to eq('Logged out successfully')
    end
  end

end
