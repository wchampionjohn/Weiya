json.extract! winner, :id, :drawn_at, :distributed, :distributed_at, :notification_requested

json.prize do
  json.extract! winner.prize, :id, :name, :prize_type, :value
end

json.participant do
  json.id winner.event_participant.participant_id
  json.event_participant_id winner.event_participant_id
  json.name winner.name
  json.employee_id winner.employee_id
  json.phone winner.phone
  json.email winner.email
end
