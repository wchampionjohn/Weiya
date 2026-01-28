require 'rails_helper'

RSpec.describe EventCopyService do
  let(:source_event) do
    create(:event,
      name: '2025 尾牙抽獎',
      event_date: Date.new(2025, 12, 31),
      status: :completed,
      allow_repeat_win: true,
      required_fields: ['name', 'employee_id'],
      sms_template: '恭喜 {name}！',
      email_template: '您中獎了！'
    )
  end

  describe '#copy' do
    context 'with default options' do
      it 'creates a new event with copied settings' do
        new_event = EventCopyService.new(source_event).copy

        expect(new_event).to be_persisted
        expect(new_event.name).to eq('2025 尾牙抽獎 (複製)')
        expect(new_event.status).to eq('draft')
        expect(new_event.copied_from_event_id).to eq(source_event.id)
      end

      it 'copies allow_repeat_win setting' do
        new_event = EventCopyService.new(source_event).copy
        expect(new_event.allow_repeat_win).to eq(source_event.allow_repeat_win)
      end

      it 'copies required_fields' do
        new_event = EventCopyService.new(source_event).copy
        expect(new_event.required_fields).to eq(source_event.required_fields)
      end

      it 'copies notification templates' do
        new_event = EventCopyService.new(source_event).copy
        expect(new_event.sms_template).to eq(source_event.sms_template)
        expect(new_event.email_template).to eq(source_event.email_template)
      end

      it 'resets public_slug' do
        source_event.update!(public_slug: 'abc123')
        new_event = EventCopyService.new(source_event).copy
        expect(new_event.public_slug).to be_nil
      end
    end

    context 'with custom options' do
      it 'uses custom name when provided' do
        new_event = EventCopyService.new(source_event, name: '2026 尾牙抽獎').copy
        expect(new_event.name).to eq('2026 尾牙抽獎')
      end

      it 'uses custom event_date when provided' do
        custom_date = Date.new(2026, 12, 31)
        new_event = EventCopyService.new(source_event, event_date: custom_date).copy
        expect(new_event.event_date.to_date).to eq(custom_date)
      end
    end

    context 'with prizes' do
      let!(:prize1) { create(:prize, event: source_event, name: '頭獎', position: 1, drawn: true, drawn_at: Time.current) }
      let!(:prize2) { create(:prize, event: source_event, name: '二獎', position: 2, drawn: false) }

      it 'copies prizes by default' do
        new_event = EventCopyService.new(source_event).copy
        expect(new_event.prizes.count).to eq(2)
      end

      it 'resets prize draw status' do
        new_event = EventCopyService.new(source_event).copy
        new_event.prizes.each do |prize|
          expect(prize.drawn).to be false
          expect(prize.drawn_at).to be_nil
          expect(prize.drawn_by).to be_nil
        end
      end

      it 'preserves prize order' do
        new_event = EventCopyService.new(source_event).copy
        expect(new_event.prizes.ordered.map(&:name)).to eq(['頭獎', '二獎'])
      end

      it 'does not copy prizes when copy_prizes is false' do
        new_event = EventCopyService.new(source_event, copy_prizes: false).copy
        expect(new_event.prizes.count).to eq(0)
      end

      it 'resets designated_participant_id' do
        participant = create(:participant)
        prize1.update!(designated_participant_id: participant.id)

        new_event = EventCopyService.new(source_event).copy
        new_event.prizes.each do |prize|
          expect(prize.designated_participant_id).to be_nil
        end
      end
    end

    context 'with participants' do
      let!(:participant1) { create(:participant) }
      let!(:participant2) { create(:participant) }

      before do
        create(:event_participant, event: source_event, participant: participant1)
        create(:event_participant, event: source_event, participant: participant2)
      end

      it 'does not copy participants by default' do
        new_event = EventCopyService.new(source_event).copy
        expect(new_event.event_participants.count).to eq(0)
      end

      it 'copies participants when copy_participants is true' do
        new_event = EventCopyService.new(source_event, copy_participants: true).copy
        expect(new_event.event_participants.count).to eq(2)
        expect(new_event.participants).to include(participant1, participant2)
      end
    end

    context 'transaction rollback' do
      it 'rolls back on error' do
        # Create a participant to trigger the copy
        participant = create(:participant)
        create(:event_participant, event: source_event, participant: participant)

        # Mock EventParticipant.create! to raise an error
        allow(EventParticipant).to receive(:create!).and_raise(ActiveRecord::RecordInvalid.new(EventParticipant.new))

        expect {
          EventCopyService.new(source_event, copy_participants: true).copy
        }.to raise_error(ActiveRecord::RecordInvalid)

        # Verify no new event was created (rolled back)
        expect(Event.where(copied_from_event_id: source_event.id).count).to eq(0)
      end
    end
  end
end
