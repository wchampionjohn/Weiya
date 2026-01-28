json.prize do
  json.partial! "api/v1/admin/prizes/prize", prize: @prize
end

json.winners @winners do |winner|
  json.id winner.id
  json.event_participant_id winner.event_participant_id
  json.participant do
    json.id winner.event_participant.participant_id
    json.name winner.name
    json.employee_id winner.employee_id
  end
  json.drawn_at winner.drawn_at
  json.display_data winner.display_data(masked: true)
end
