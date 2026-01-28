require 'rails_helper'

RSpec.describe 'Api::V1::Admin::Prizes', type: :request do
  let(:admin) { create(:admin) }
  let(:event) { create(:event) }

  before do
    post '/api/v1/admin/session', params: { email: admin.email, password: 'password123' }
  end

  describe 'POST /api/v1/admin/events/:event_id/prizes' do
    let(:valid_params) do
      {
        prize: {
          name: 'Grand Prize',
          prize_type: 'gift',
          value: 10000,
          quantity: 1,
          position: 1
        }
      }
    end

    it 'creates a prize' do
      expect {
        post "/api/v1/admin/events/#{event.id}/prizes", params: valid_params
      }.to change(Prize, :count).by(1)

      expect(response).to have_http_status(:created)
    end
  end

  describe 'DELETE /api/v1/admin/events/:event_id/prizes/:id' do
    let!(:prize) { create(:prize, event: event) }

    it 'deletes the prize' do
      expect {
        delete "/api/v1/admin/events/#{event.id}/prizes/#{prize.id}"
      }.to change(Prize, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end
  end

  # Phase 2: Bonus prize
  describe 'POST /api/v1/admin/events/:event_id/prizes/bonus' do
    let(:active_event) { create(:event, status: :active) }
    let!(:drawn_prize) { create(:prize, event: active_event, position: 1, drawn: true, drawn_at: 1.hour.ago) }
    let!(:undrawn_prize) { create(:prize, event: active_event, position: 2, drawn: false) }

    let(:bonus_params) do
      {
        prize: {
          name: '加碼獎',
          prize_type: 'cash',
          value: 5000,
          quantity: 1
        }
      }
    end

    it 'creates a bonus prize for active event' do
      expect {
        post "/api/v1/admin/events/#{active_event.id}/prizes/bonus", params: bonus_params
      }.to change(Prize, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(json_response['name']).to eq('加碼獎')
      expect(json_response['is_bonus']).to be true
    end

    it 'inserts bonus prize after the latest drawn prize' do
      post "/api/v1/admin/events/#{active_event.id}/prizes/bonus", params: bonus_params

      new_prize = Prize.find(json_response['id'])
      expect(new_prize.position).to eq(2)

      # Undrawn prize should be shifted
      expect(undrawn_prize.reload.position).to eq(3)
    end

    it 'returns error for draft event' do
      post "/api/v1/admin/events/#{event.id}/prizes/bonus", params: bonus_params

      expect(response).to have_http_status(:forbidden)
      expect(json_response['error']).to eq('只有進行中的活動可以新增加碼獎項')
    end

    it 'returns error for completed event' do
      completed_event = create(:event, status: :completed)

      post "/api/v1/admin/events/#{completed_event.id}/prizes/bonus", params: bonus_params

      expect(response).to have_http_status(:forbidden)
    end

    it 'returns validation errors for invalid params' do
      post "/api/v1/admin/events/#{active_event.id}/prizes/bonus", params: { prize: { name: '' } }

      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  # Phase 2: Eligibility rules
  describe 'GET /api/v1/admin/events/:event_id/prizes/:id/eligible_participants' do
    let(:event_with_participants) { create(:event, :active, event_date: Date.new(2025, 12, 31)) }
    let(:prize) { create(:prize, event: event_with_participants, quantity: 1) }

    let!(:senior_engineering) do
      p = create(:participant, hire_date: Date.new(2020, 1, 1), department: 'Engineering')
      create(:event_participant, event: event_with_participants, participant: p)
    end

    let!(:junior_engineering) do
      p = create(:participant, hire_date: Date.new(2024, 6, 1), department: 'Engineering')
      create(:event_participant, event: event_with_participants, participant: p)
    end

    let!(:senior_sales) do
      p = create(:participant, hire_date: Date.new(2019, 1, 1), department: 'Sales')
      create(:event_participant, event: event_with_participants, participant: p)
    end

    it 'returns all participants when no eligibility rules' do
      get "/api/v1/admin/events/#{event_with_participants.id}/prizes/#{prize.id}/eligible_participants"

      expect(response).to have_http_status(:ok)
      expect(json_response['total_count']).to eq(3)
      expect(json_response['eligible_count']).to eq(3)
    end

    it 'filters by minimum seniority years' do
      prize.update!(eligibility_rules: { 'min_seniority_years' => 3 })

      get "/api/v1/admin/events/#{event_with_participants.id}/prizes/#{prize.id}/eligible_participants"

      expect(response).to have_http_status(:ok)
      expect(json_response['total_count']).to eq(3)
      expect(json_response['eligible_count']).to eq(2)
      participant_ids = json_response['participants'].map { |p| p['id'] }
      expect(participant_ids).to include(senior_engineering.participant_id)
      expect(participant_ids).to include(senior_sales.participant_id)
      expect(participant_ids).not_to include(junior_engineering.participant_id)
    end

    it 'filters by department' do
      prize.update!(eligibility_rules: { 'departments' => ['Engineering'] })

      get "/api/v1/admin/events/#{event_with_participants.id}/prizes/#{prize.id}/eligible_participants"

      expect(response).to have_http_status(:ok)
      expect(json_response['eligible_count']).to eq(2)
      participant_ids = json_response['participants'].map { |p| p['id'] }
      expect(participant_ids).to include(senior_engineering.participant_id)
      expect(participant_ids).to include(junior_engineering.participant_id)
    end

    it 'filters by combined rules' do
      prize.update!(eligibility_rules: {
        'min_seniority_years' => 3,
        'departments' => ['Engineering']
      })

      get "/api/v1/admin/events/#{event_with_participants.id}/prizes/#{prize.id}/eligible_participants"

      expect(response).to have_http_status(:ok)
      expect(json_response['eligible_count']).to eq(1)
      expect(json_response['participants'].first['id']).to eq(senior_engineering.participant_id)
    end
  end

  describe 'PATCH /api/v1/admin/events/:event_id/prizes/:id with eligibility_rules' do
    let!(:prize) { create(:prize, event: event) }

    it 'updates eligibility rules' do
      patch "/api/v1/admin/events/#{event.id}/prizes/#{prize.id}", params: {
        prize: {
          eligibility_rules: {
            min_seniority_years: 5,
            departments: ['Engineering', 'Marketing']
          }
        }
      }

      expect(response).to have_http_status(:ok)
      prize.reload
      expect(prize.min_seniority_years).to eq(5)
      expect(prize.required_departments).to eq(['Engineering', 'Marketing'])
    end

    it 'clears eligibility rules with empty hash' do
      prize.update!(eligibility_rules: { 'min_seniority_years' => 3 })

      patch "/api/v1/admin/events/#{event.id}/prizes/#{prize.id}", params: {
        prize: {
          eligibility_rules: {}
        }
      }

      expect(response).to have_http_status(:ok)
      expect(prize.reload.eligibility_rules).to eq({})
    end
  end

end
