json.extract! @event, :id, :name, :event_date, :status
json.password_required @event.has_password? && !event_verified?(@event)

json.prizes @event.prizes.ordered do |prize|
  json.extract! prize, :id, :name, :prize_type, :value, :quantity, :drawn, :drawn_at, :position,
                :scheduled_at, :is_bonus

  if prize.drawn?
    json.winners prize.winners do |winner|
      json.id winner.id
      json.display_data winner.display_data(masked: true)
    end
  else
    json.winners []
  end
end

# Schedule info for undrawn prizes with scheduled_at
json.schedule @event.prizes.undrawn.scheduled do |prize|
  json.extract! prize, :id, :name, :scheduled_at, :is_bonus
end
