json.extract! prize, :id, :name, :prize_type_id, :value, :quantity, :taxable, :position,
              :display_fields, :privacy_settings, :allow_repeat_win_override, :scheduled_at,
              :drawn, :drawn_at, :drawn_by, :is_bonus, :designated_participant_ids,
              :eligibility_rules, :created_at, :updated_at
json.remaining_quantity prize.remaining_quantity
json.can_draw prize.can_draw?

if prize.prize_type.present?
  json.prize_type do
    json.id prize.prize_type.id
    json.name prize.prize_type.name
    json.code prize.prize_type.code
  end
end

if prize.has_designated_participants?
  json.designated_participants prize.designated_participants.includes(:department) do |participant|
    json.id participant.id
    json.name participant.name
    json.employee_id participant.employee_id
    json.department participant.department&.name
  end
end

if prize.drawn?
  json.winners prize.winners.includes(event_participant: { participant: :department }) do |winner|
    json.id winner.id
    json.name winner.event_participant.name
    json.employee_id winner.event_participant.employee_id
    json.department winner.event_participant.participant.department&.name
    json.drawn_at winner.drawn_at
    json.distributed winner.distributed
    json.distributed_at winner.distributed_at
  end
end
