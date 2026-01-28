class ScheduledDrawJob < ApplicationJob
  queue_as :default

  def perform(prize_id)
    prize = Prize.find_by(id: prize_id)
    return unless prize
    return if prize.drawn?

    result = DrawService.new(prize).call

    unless result.success?
      Rails.logger.error("Scheduled draw failed for prize #{prize_id}: #{result.error}")
    end
  end
end
