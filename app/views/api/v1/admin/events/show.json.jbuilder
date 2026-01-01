json.partial! "api/v1/admin/events/event", event: @event

json.prizes @event.prizes.ordered do |prize|
  json.partial! "api/v1/admin/prizes/prize", prize: prize
end

json.participants @event.event_participants do |event_participant|
  json.partial! "api/v1/admin/participants/event_participant", event_participant: event_participant
end
