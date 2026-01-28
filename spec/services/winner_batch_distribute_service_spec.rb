require 'rails_helper'

RSpec.describe WinnerBatchDistributeService do
  let(:event) { create(:event) }
  let(:prize) { create(:prize, event: event, drawn: true) }
  let(:participants) { create_list(:participant, 3) }
  let!(:event_participants) do
    participants.map { |p| create(:event_participant, event: event, participant: p) }
  end
  let!(:winners) do
    event_participants.map { |ep| create(:winner, prize: prize, event_participant: ep) }
  end

  describe '#distribute' do
    context 'when all winners are undistributed' do
      it 'marks all as distributed' do
        service = described_class.new(winners.map(&:id))
        result = service.distribute.result

        expect(result[:distributed_count]).to eq(3)
        expect(result[:skipped_count]).to eq(0)
        expect(result[:winners].length).to eq(3)

        winners.each do |winner|
          expect(winner.reload.distributed?).to be true
          expect(winner.distributed_at).to be_present
        end
      end
    end

    context 'when some winners are already distributed' do
      before do
        winners.first.update!(distributed: true, distributed_at: 1.day.ago)
      end

      it 'skips already distributed winners' do
        service = described_class.new(winners.map(&:id))
        result = service.distribute.result

        expect(result[:distributed_count]).to eq(2)
        expect(result[:skipped_count]).to eq(1)
      end
    end

    context 'when all winners are already distributed' do
      before do
        winners.each { |w| w.update!(distributed: true, distributed_at: 1.day.ago) }
      end

      it 'returns all as skipped' do
        service = described_class.new(winners.map(&:id))
        result = service.distribute.result

        expect(result[:distributed_count]).to eq(0)
        expect(result[:skipped_count]).to eq(3)
      end
    end

    context 'with partial winner IDs' do
      it 'only processes provided IDs' do
        service = described_class.new([winners.first.id, winners.second.id])
        result = service.distribute.result

        expect(result[:distributed_count]).to eq(2)
        expect(result[:winners].length).to eq(2)
        expect(winners.third.reload.distributed?).to be false
      end
    end

    context 'with empty winner IDs' do
      it 'returns zero counts' do
        service = described_class.new([])
        result = service.distribute.result

        expect(result[:distributed_count]).to eq(0)
        expect(result[:skipped_count]).to eq(0)
        expect(result[:winners]).to be_empty
      end
    end

    context 'with notification options' do
      let(:sms_template) { '恭喜 {name}！您獲得 {prize}' }
      let(:email_template) { '親愛的 {name}，恭喜您在 {event_name} 中獲得 {prize}！' }

      before do
        participants[0].update!(phone: '0912345678', email: 'test1@example.com')
        participants[1].update!(phone: '0923456789', email: nil)
        participants[2].update!(phone: nil, email: 'test3@example.com')
      end

      context 'when sending SMS notifications' do
        it 'counts SMS sent to winners with phone numbers' do
          notification_options = {
            send_sms: true,
            send_email: false,
            sms_template: sms_template
          }

          service = described_class.new(winners.map(&:id), notification_options)
          result = service.distribute.result

          expect(result[:sms_sent_count]).to eq(2)
          expect(result[:email_sent_count]).to eq(0)
        end

        it 'substitutes template variables correctly' do
          notification_options = {
            send_sms: true,
            send_email: false,
            sms_template: sms_template
          }

          expect(Rails.logger).to receive(:info).with(/恭喜 #{participants[0].name}！您獲得 #{prize.name}/).at_least(:once)
          allow(Rails.logger).to receive(:info)

          service = described_class.new([winners.first.id], notification_options)
          service.distribute
        end
      end

      context 'when sending Email notifications' do
        it 'counts emails sent to winners with email addresses' do
          notification_options = {
            send_sms: false,
            send_email: true,
            email_template: email_template
          }

          service = described_class.new(winners.map(&:id), notification_options)
          result = service.distribute.result

          expect(result[:sms_sent_count]).to eq(0)
          expect(result[:email_sent_count]).to eq(2)
        end
      end

      context 'when sending both SMS and Email' do
        it 'counts both types correctly' do
          notification_options = {
            send_sms: true,
            send_email: true,
            sms_template: sms_template,
            email_template: email_template
          }

          service = described_class.new(winners.map(&:id), notification_options)
          result = service.distribute.result

          expect(result[:sms_sent_count]).to eq(2)
          expect(result[:email_sent_count]).to eq(2)
        end
      end

      context 'when notifications are disabled' do
        it 'does not send any notifications' do
          notification_options = {
            send_sms: false,
            send_email: false
          }

          service = described_class.new(winners.map(&:id), notification_options)
          result = service.distribute.result

          expect(result[:sms_sent_count]).to eq(0)
          expect(result[:email_sent_count]).to eq(0)
        end
      end

      context 'when template is blank' do
        it 'does not count notifications' do
          notification_options = {
            send_sms: true,
            send_email: true,
            sms_template: '',
            email_template: nil
          }

          service = described_class.new(winners.map(&:id), notification_options)
          result = service.distribute.result

          expect(result[:sms_sent_count]).to eq(0)
          expect(result[:email_sent_count]).to eq(0)
        end
      end

      context 'when winner is already distributed' do
        before do
          winners.first.update!(distributed: true, distributed_at: 1.day.ago)
        end

        it 'still sends notifications for already distributed winners' do
          notification_options = {
            send_sms: true,
            send_email: true,
            sms_template: sms_template,
            email_template: email_template
          }

          service = described_class.new(winners.map(&:id), notification_options)
          result = service.distribute.result

          # First winner is skipped for distribution but still gets notification
          expect(result[:distributed_count]).to eq(2)
          expect(result[:skipped_count]).to eq(1)
          # All 3 get notifications: first has both, second has phone, third has email
          expect(result[:sms_sent_count]).to eq(2)
          expect(result[:email_sent_count]).to eq(2)
        end
      end

      context 'when notify only mode' do
        it 'sends notifications without distributing' do
          notification_options = {
            distribute: false,
            send_sms: true,
            send_email: true,
            sms_template: sms_template,
            email_template: email_template
          }

          service = described_class.new(winners.map(&:id), notification_options)
          result = service.distribute.result

          expect(result[:distributed_count]).to eq(0)
          expect(result[:skipped_count]).to eq(0)
          expect(result[:sms_sent_count]).to eq(2)
          expect(result[:email_sent_count]).to eq(2)

          # Verify winners are not distributed
          winners.each do |w|
            expect(w.reload.distributed?).to be false
          end
        end
      end
    end
  end
end
