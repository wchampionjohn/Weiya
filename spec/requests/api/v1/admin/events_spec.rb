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

  # Phase 2: Copy event
  describe 'POST /api/v1/admin/events/:id/copy' do
    let(:event) { create(:event, name: '2025 尾牙抽獎', status: :completed) }
    let!(:prize) { create(:prize, event: event) }

    it 'copies the event' do
      expect {
        post "/api/v1/admin/events/#{event.id}/copy"
      }.to change(Event, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(json_response['name']).to eq('2025 尾牙抽獎 (複製)')
      expect(json_response['status']).to eq('draft')
    end

    it 'copies with custom name' do
      post "/api/v1/admin/events/#{event.id}/copy", params: { event: { name: '2026 尾牙抽獎' } }

      expect(response).to have_http_status(:created)
      expect(json_response['name']).to eq('2026 尾牙抽獎')
    end

    it 'copies prizes by default' do
      post "/api/v1/admin/events/#{event.id}/copy"

      new_event = Event.find(json_response['id'])
      expect(new_event.prizes.count).to eq(1)
    end

    it 'does not copy prizes when copy_prizes is false' do
      post "/api/v1/admin/events/#{event.id}/copy", params: { event: { copy_prizes: false } }

      new_event = Event.find(json_response['id'])
      expect(new_event.prizes.count).to eq(0)
    end

    it 'copies participants when copy_participants is true' do
      participant = create(:participant)
      create(:event_participant, event: event, participant: participant)

      post "/api/v1/admin/events/#{event.id}/copy", params: { event: { copy_participants: true } }

      new_event = Event.find(json_response['id'])
      expect(new_event.participants.count).to eq(1)
    end
  end

  # Phase 2: Preview notification
  describe 'POST /api/v1/admin/events/:id/preview_notification' do
    let(:event) { create(:event, sms_template: '恭喜 {name}！您獲得 {prize}！', email_template: '親愛的 {name}') }

    it 'previews SMS template' do
      post "/api/v1/admin/events/#{event.id}/preview_notification", params: {
        template_type: 'sms',
        sample_data: { 'name' => '王小明', 'prize' => '頭獎' }
      }

      expect(response).to have_http_status(:success)
      expect(json_response['preview']).to eq('恭喜 王小明！您獲得 頭獎！')
    end

    it 'previews email template' do
      post "/api/v1/admin/events/#{event.id}/preview_notification", params: {
        template_type: 'email',
        sample_data: { 'name' => '王小明' }
      }

      expect(response).to have_http_status(:success)
      expect(json_response['preview']).to eq('親愛的 王小明')
    end

    it 'returns error for invalid template type' do
      post "/api/v1/admin/events/#{event.id}/preview_notification", params: { template_type: 'invalid' }

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response['error']).to eq('無效的模板類型')
    end

    it 'returns error when template is not set' do
      event.update!(sms_template: nil)
      post "/api/v1/admin/events/#{event.id}/preview_notification", params: { template_type: 'sms' }

      expect(response).to have_http_status(:unprocessable_entity)
      expect(json_response['error']).to eq('模板尚未設定')
    end
  end

end
