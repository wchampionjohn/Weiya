class Participant < ApplicationRecord
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
      "name LIKE :q OR employee_id LIKE :q OR phone LIKE :q OR email LIKE :q",
      q: "%#{query}%"
    )
  }

  def display_value(field, masked: false, privacy_settings: {})
    value = send(field) if respond_to?(field)
    return value unless masked && privacy_settings[field.to_s]

    PrivacyMaskService.mask(value, field)
  end

  def events_count
    events.count
  end
end
