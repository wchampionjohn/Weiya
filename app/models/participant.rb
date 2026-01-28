class Participant < ApplicationRecord
  belongs_to :department, optional: true

  has_many :event_participants, dependent: :destroy
  has_many :events, through: :event_participants
  has_many :winners, through: :event_participants

  validates :name, presence: true
  validates :employee_id, uniqueness: { allow_nil: true, message: "已存在" }
  validates :phone, uniqueness: { allow_nil: true, message: "已存在" }
  validates :email, uniqueness: { allow_nil: true, message: "已存在" }
  validates :email, format: { with: URI::MailTo::EMAIL_REGEXP, allow_blank: true }

  scope :search, ->(query) {
    return all if query.blank?
    where(
      "name LIKE :q OR employee_id LIKE :q OR phone LIKE :q OR email LIKE :q OR department LIKE :q",
      q: "%#{query}%"
    )
  }

  scope :in_department, ->(department) {
    return all if department.blank?
    where(department: department)
  }

  scope :in_departments, ->(department_names) {
    return all if department_names.blank? || department_names.empty?
    department_ids = Department.where(name: department_names).pluck(:id)
    return none if department_ids.empty?
    where(department_id: department_ids)
  }

  def display_value(field, masked: false, privacy_settings: {})
    value = send(field) if respond_to?(field)
    return value unless masked && privacy_settings[field.to_s]

    PrivacyMaskService.mask(value, field)
  end

  def events_count
    events.count
  end

  # Calculate seniority years based on event date (Phase 2)
  def seniority_years_for(event)
    return nil unless hire_date
    ((event.event_date.to_date - hire_date) / 365.25).floor
  end

  # Check if participant meets minimum seniority requirement
  def meets_seniority_requirement?(event, min_years)
    return true if min_years.nil? || min_years <= 0
    years = seniority_years_for(event)
    years.present? && years >= min_years
  end
end
