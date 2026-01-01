json.extract! prize, :id, :name, :prize_type, :value, :quantity, :taxable, :position,
              :display_fields, :privacy_settings, :allow_repeat_win_override, :scheduled_at,
              :drawn, :drawn_at, :drawn_by, :created_at, :updated_at
json.remaining_quantity prize.remaining_quantity
json.can_draw prize.can_draw?
