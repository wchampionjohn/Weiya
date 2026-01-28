require "csv"

class ParticipantImportService
  Result = Struct.new(:success, :imported_count, :errors, keyword_init: true) do
    def success?
      success
    end
  end

  def initialize(event, file_content, options = {})
    @event = event
    @file_content = file_content
    @skip_header = options.fetch(:skip_header, true)
    @errors = []
    @imported_count = 0
  end

  def call
    parse_and_import
    Result.new(success: @errors.empty?, imported_count: @imported_count, errors: @errors)
  end

  private

  def parse_and_import
    rows = CSV.parse(@file_content)
    rows.shift if @skip_header && rows.any?

    ActiveRecord::Base.transaction do
      rows.each_with_index do |row, index|
        import_row(row, index + (@skip_header ? 2 : 1))
      end

      raise ActiveRecord::Rollback if @errors.any?
    end
  end

  def import_row(row, line_number)
    participant = find_or_build_participant(row)

    if participant.new_record? && !participant.save
      @errors << { line: line_number, errors: participant.errors.full_messages }
      return
    end

    event_participant = @event.event_participants.find_or_initialize_by(participant: participant)
    if event_participant.new_record?
      if event_participant.save
        @imported_count += 1
      else
        @errors << { line: line_number, errors: event_participant.errors.full_messages }
      end
    end
  rescue StandardError => e
    @errors << { line: line_number, errors: [e.message] }
  end

  def find_or_build_participant(row)
    attrs = extract_attributes(row)

    # Try to find existing participant by unique identifiers
    participant = find_existing_participant(attrs)
    return participant if participant

    # Build new participant
    Participant.new(attrs)
  end

  def extract_attributes(row)
    attrs = {}
    field_mapping.each do |field, index|
      value = row[index]&.strip
      attrs[field] = parse_field_value(field, value)
    end
    attrs
  end

  def parse_field_value(field, value)
    return nil if value.blank?

    case field
    when :hire_date
      parse_date(value)
    else
      value
    end
  end

  def parse_date(value)
    return nil if value.blank?

    # Try common date formats
    formats = [
      "%Y-%m-%d",      # 2020-01-15
      "%Y/%m/%d",      # 2020/01/15
      "%d/%m/%Y",      # 15/01/2020
      "%m/%d/%Y",      # 01/15/2020
      "%Y%m%d"         # 20200115
    ]

    formats.each do |format|
      begin
        return Date.strptime(value, format)
      rescue ArgumentError
        next
      end
    end

    # Last resort: try Date.parse
    begin
      Date.parse(value)
    rescue ArgumentError
      nil
    end
  end

  def find_existing_participant(attrs)
    return Participant.find_by(employee_id: attrs[:employee_id]) if attrs[:employee_id].present?
    return Participant.find_by(email: attrs[:email]) if attrs[:email].present?
    return Participant.find_by(phone: attrs[:phone]) if attrs[:phone].present?
    nil
  end

  def field_mapping
    {
      name: 0,
      employee_id: 1,
      phone: 2,
      email: 3,
      hire_date: 4,
      department: 5
    }
  end
end
