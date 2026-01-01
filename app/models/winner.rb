class Winner < ApplicationRecord
  belongs_to :prize
  belongs_to :event_participant
  belongs_to :distributor, class_name: "Admin", foreign_key: :distributed_by, optional: true

  has_one :participant, through: :event_participant

  validates :prize_id, presence: true
  validates :event_participant_id, presence: true
  validates :drawn_at, presence: true
  validates :event_participant_id, uniqueness: { scope: :prize_id, message: "已獲得此獎項" }

  scope :distributed, -> { where(distributed: true) }
  scope :pending, -> { where(distributed: false) }

  delegate :event, to: :prize
  delegate :name, :employee_id, :phone, :email, to: :event_participant

  def mark_distributed!(admin)
    update!(distributed: true, distributed_at: Time.current, distributed_by: admin.id)
  end

  def display_data(masked: true)
    settings = prize.privacy_settings || {}
    fields = prize.display_fields || ["name"]

    fields.each_with_object({}) do |field, result|
      result[field] = event_participant.display_value(field, masked: masked, privacy_settings: settings)
    end
  end
end
