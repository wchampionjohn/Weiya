json.extract! event, :id, :name, :event_date, :status, :allow_repeat_win, :required_fields,
  :display_fields, :privacy_enabled, :privacy_settings, :password,
  :public_access_enabled, :public_slug, :created_at, :updated_at
json.has_password event.has_password?
json.participants_count event.participants_count
json.prizes_count event.prizes_count
json.public_identifier event.public_identifier
json.use_random_url event.use_random_url?
