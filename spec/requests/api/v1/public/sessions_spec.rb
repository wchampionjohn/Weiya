require 'rails_helper'

RSpec.describe 'Api::V1::Public::Sessions', type: :request do
  let(:event) { create(:event, required_fields: ['employee_id']) }
  let!(:participant) { create(:participant, event: event, employee_id: 'E001') }

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
  end

  def json_response
    JSON.parse(response.body)
  end
end
