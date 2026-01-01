require 'rails_helper'

RSpec.describe 'Api::V1::Admin::Sessions', type: :request do
  let(:admin) { create(:admin, email: 'admin@test.com', password: 'password123') }

  describe 'POST /api/v1/admin/session' do
    context 'with valid credentials' do
      it 'returns success' do
        post '/api/v1/admin/session', params: { email: admin.email, password: 'password123' }
        expect(response).to have_http_status(:success)
        expect(json_response['admin']['email']).to eq(admin.email)
      end
    end

    context 'with invalid credentials' do
      it 'returns unauthorized' do
        post '/api/v1/admin/session', params: { email: admin.email, password: 'wrong' }
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'DELETE /api/v1/admin/session' do
    it 'returns success' do
      delete '/api/v1/admin/session'
      expect(response).to have_http_status(:success)
    end
  end

end
