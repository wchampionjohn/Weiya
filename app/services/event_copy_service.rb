class EventCopyService
  def initialize(source_event, options = {})
    @source_event = source_event
    @options = options
  end

  def copy
    Event.transaction do
      new_event = build_new_event
      new_event.save!

      copy_prizes(new_event) if @options.fetch(:copy_prizes, true)
      copy_participants(new_event) if @options.fetch(:copy_participants, false)

      new_event
    end
  end

  private

  def build_new_event
    new_event = @source_event.dup

    new_event.name = @options[:name] || "#{@source_event.name} (複製)"
    new_event.event_date = @options[:event_date] || Date.tomorrow
    new_event.status = :draft
    new_event.copied_from_event_id = @source_event.id

    # Reset publish-related fields
    new_event.public_slug = nil

    # Copy templates if present
    new_event.sms_template = @source_event.sms_template
    new_event.email_template = @source_event.email_template

    new_event
  end

  def copy_prizes(new_event)
    @source_event.prizes.ordered.each do |prize|
      new_prize = prize.dup

      # Reset draw status
      new_prize.event = new_event
      new_prize.drawn = false
      new_prize.drawn_at = nil
      new_prize.drawn_by = nil

      # Reset designated participants (needs to be re-selected for new event)
      new_prize.designated_participant_ids = []

      new_prize.save!
    end
  end

  def copy_participants(new_event)
    @source_event.event_participants.find_each do |ep|
      EventParticipant.create!(
        event: new_event,
        participant_id: ep.participant_id
      )
    end
  end
end
