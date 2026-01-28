class NotificationTemplate < ApplicationRecord
  # notification_type: 'winning' (中獎通知) or 'distribution' (發放通知)
  # method: 'sms' or 'email'

  NOTIFICATION_TYPES = %w[winning distribution].freeze
  METHODS = %w[sms email].freeze

  validates :name, presence: true
  validates :notification_type, presence: true, inclusion: { in: NOTIFICATION_TYPES }
  validates :method, presence: true, inclusion: { in: METHODS }
  validates :content, presence: true

  scope :winning, -> { where(notification_type: 'winning') }
  scope :distribution, -> { where(notification_type: 'distribution') }
  scope :sms, -> { where(method: 'sms') }
  scope :email, -> { where(method: 'email') }
  scope :defaults, -> { where(is_default: true) }
  scope :ordered, -> { order(:position, :id) }

  def self.notification_type_label(type)
    case type
    when 'winning' then '中獎通知'
    when 'distribution' then '發放通知'
    else type
    end
  end

  def self.method_label(method)
    case method
    when 'sms' then '簡訊'
    when 'email' then 'Email'
    else method
    end
  end

  def notification_type_label
    self.class.notification_type_label(notification_type)
  end

  def method_label
    self.class.method_label(method)
  end
end
