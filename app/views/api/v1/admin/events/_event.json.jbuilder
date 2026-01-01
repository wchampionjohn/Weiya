json.extract! event, :id, :name, :event_date, :status, :allow_repeat_win, :required_fields, :created_at, :updated_at
json.has_password event.has_password?
json.participants_count event.participants_count
json.prizes_count event.prizes_count
