class WinnerNotificationMailer < ApplicationMailer
  default from: "lottery@example.com"

  # Email notification for winner
  def winner_notification(winner:, subject:, body:)
    @winner = winner
    @body = body
    @participant = winner.event_participant.participant
    @prize = winner.prize
    @event = @prize.event

    mail(
      to: @participant.email,
      subject: subject.presence || default_subject
    )
  end

  # SMS notification displayed as email (for development preview)
  def sms_notification(winner:, phone:, message:)
    @winner = winner
    @phone = phone
    @message = message
    @participant = winner.event_participant.participant
    @prize = winner.prize
    @event = @prize.event

    mail(
      to: "sms-preview@localhost",
      subject: "[SMS] #{@phone} - #{@event.name}"
    )
  end

  private

  def default_subject
    "[#{@event.name}] 恭喜您獲得 #{@prize.name}！"
  end
end
