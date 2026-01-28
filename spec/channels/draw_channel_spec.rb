require 'rails_helper'

RSpec.describe DrawChannel, type: :channel do
  let(:event) { create(:event) }

  before do
    stub_connection connection_identifier: SecureRandom.uuid
  end

  describe '#subscribed' do
    it 'successfully subscribes with event_id' do
      subscribe(event_id: event.id)
      expect(subscription).to be_confirmed
    end

    it 'streams from the correct channel' do
      subscribe(event_id: event.id)
      expect(subscription).to have_stream_from("draw_channel_#{event.id}")
    end

    it 'rejects without event_id' do
      subscribe(event_id: nil)
      expect(subscription).to be_rejected
    end
  end

  describe '#unsubscribed' do
    it 'stops streaming' do
      subscribe(event_id: event.id)
      unsubscribe
      expect(subscription).not_to have_streams
    end
  end
end
