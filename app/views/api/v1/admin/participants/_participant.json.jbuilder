json.extract! participant, :id, :name, :employee_id, :phone, :email, :hire_date, :created_at, :updated_at
json.department participant.department&.name
json.events_count participant.events_count
