json.array! @templates do |template|
  json.extract! template, :id, :name, :notification_type, :method, :content, :is_default, :position
  json.notification_type_label template.notification_type_label
  json.method_label template.method_label
end
