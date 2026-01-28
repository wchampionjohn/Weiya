require 'rails_helper'

RSpec.describe 'Api::V1::Public::Events', type: :request do
  let(:event) { create(:event, :active) }
  let!(:prizes) { create_list(:prize, 3, event: event) }

  describe 'GET /api/v1/public/events/:id' do
    context 'without password' do
      it 'returns event details' do
        get "/api/v1/public/events/#{event.id}"
        expect(response).to have_http_status(:success)
        expect(json_response['name']).to eq(event.name)
        expect(json_response['prizes'].size).to eq(3)
      end
    end

    context 'with password protection' do
      let(:event) { create(:event, :active, :with_password) }

      it 'requires password verification' do
        get "/api/v1/public/events/#{event.id}"
        expect(response).to have_http_status(:forbidden)
        expect(json_response['password_required']).to be true
      end
    end
  end

  describe 'POST /api/v1/public/events/:id/verify' do
    let(:event) { create(:event, :active, password: 'secret123') }

    context 'with correct password' do
      it 'verifies successfully' do
        post "/api/v1/public/events/#{event.id}/verify", params: { password: 'secret123' }
        expect(response).to have_http_status(:success)
        expect(json_response['verified']).to be true
      end
    end

    context 'with incorrect password' do
      it 'returns unauthorized' do
        post "/api/v1/public/events/#{event.id}/verify", params: { password: 'wrong' }
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

end
