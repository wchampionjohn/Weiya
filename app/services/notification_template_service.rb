class NotificationTemplateService
  ALLOWED_VARIABLES = %w[name prize value event_name employee_id phone email department].freeze

  def self.render(template, winner)
    new.render(template, winner)
  end

  def self.preview(template, sample_data = {})
    new.preview(template, sample_data)
  end

  def render(template, winner)
    return template if template.blank?

    result = template.dup
    variables = {
      'name' => winner.participant.name,
      'prize' => winner.prize.name,
      'value' => winner.prize.value.to_s,
      'event_name' => winner.prize.event.name,
      'employee_id' => winner.participant.employee_id || '',
      'phone' => winner.participant.phone || '',
      'email' => winner.participant.email || '',
      'department' => winner.participant.department || ''
    }

    variables.each do |var, value|
      result.gsub!("{#{var}}", value.to_s)
    end

    result
  end

  def preview(template, sample_data = {})
    return template if template.blank?

    result = template.dup
    ALLOWED_VARIABLES.each do |var|
      value = sample_data[var] || sample_data[var.to_sym] || "[#{var}]"
      result.gsub!("{#{var}}", value.to_s)
    end

    result
  end
end
