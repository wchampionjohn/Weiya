class WinnerBatchDistributeService
  attr_reader :winners, :distributed_count, :skipped_count, :notified_count,
              :sms_sent_count, :email_sent_count, :processed_winners

  def initialize(winner_ids, options = {})
    @winner_ids = winner_ids
    @options = options
    @distributed_count = 0
    @skipped_count = 0
    @notified_count = 0
    @sms_sent_count = 0
    @email_sent_count = 0
    @processed_winners = []
  end

  def execute
    @winners = Winner.where(id: @winner_ids)
                     .includes(event_participant: { participant: :department }, prize: :event)

    Winner.transaction do
      @winners.each do |winner|
        process_winner(winner)
        @processed_winners << winner
      end
    end

    self
  end

  # Keep old method name for backward compatibility
  alias_method :distribute, :execute

  def result
    {
      distributed_count: @distributed_count,
      skipped_count: @skipped_count,
      notified_count: @notified_count,
      sms_sent_count: @sms_sent_count,
      email_sent_count: @email_sent_count,
      winners: @processed_winners
    }
  end

  private

  def process_winner(winner)
    should_distribute = @options[:distribute] != false
    should_notify = @options[:send_sms] || @options[:send_email]

    if should_distribute
      if winner.distributed?
        @skipped_count += 1
        return unless should_notify # Skip notification for already distributed if only distributing
      else
        winner.update!(distributed: true, distributed_at: Time.current)
        @distributed_count += 1
      end
    end

    if should_notify
      sent = send_notifications(winner)
      @notified_count += 1 if sent
    end
  end

  def send_notifications(winner)
    participant = winner.event_participant.participant
    variables = build_template_variables(winner)
    sent = false

    if @options[:send_sms] && participant.phone.present?
      send_sms(participant.phone, variables, winner)
      sent = true
    end

    if @options[:send_email] && participant.email.present?
      send_email(participant.email, variables, winner)
      sent = true
    end

    # Mark as notified
    winner.update!(notification_requested: true) if sent

    sent
  end

  def build_template_variables(winner)
    participant = winner.event_participant.participant
    prize = winner.prize
    event = prize.event

    {
      "name" => participant.name,
      "prize" => prize.name,
      "value" => prize.value.to_s,
      "event_name" => event.name,
      "employee_id" => participant.employee_id,
      "phone" => participant.phone,
      "email" => participant.email,
      "department" => participant.department&.name
    }
  end

  def substitute_variables(template, variables)
    return "" if template.blank?

    result = template.dup
    variables.each do |key, value|
      result.gsub!("{#{key}}", value.to_s)
    end
    result
  end

  def send_sms(phone, variables, winner)
    template = @options[:sms_template]
    return if template.blank?

    message = substitute_variables(template, variables)

    # Send SMS as email for development preview via letter_opener
    WinnerNotificationMailer.sms_notification(
      winner: winner,
      phone: phone,
      message: message
    ).deliver_now

    Rails.logger.info "[SMS] To: #{phone}, Message: #{message}"
    @sms_sent_count += 1
  end

  def send_email(email, variables, winner)
    template = @options[:email_template]
    return if template.blank?

    body = substitute_variables(template, variables)
    event = winner.prize.event

    WinnerNotificationMailer.winner_notification(
      winner: winner,
      subject: "[#{event.name}] 恭喜您獲得 #{winner.prize.name}！",
      body: body
    ).deliver_now

    Rails.logger.info "[Email] To: #{email}"
    @email_sent_count += 1
  end
end
