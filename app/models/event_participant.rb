class EventParticipant < ApplicationRecord
  belongs_to :event
  belongs_to :participant
  has_many :winners, dependent: :destroy

  validates :event_id, presence: true
  validates :participant_id, presence: true
  validates :participant_id, uniqueness: { scope: :event_id, message: "已加入此活動" }

  scope :eligible_for, ->(prize) {
    if prize.event.allow_repeat_win_for_prize?(prize)
      all
    else
      where.not(id: Winner.where(prize: prize.event.prizes).select(:event_participant_id))
    end
  }

  scope :not_won_in_event, -> {
    where.not(id: Winner.select(:event_participant_id))
  }

  delegate :name, :employee_id, :phone, :email, to: :participant

  def has_won?
    winners.exists?
  end

  def display_value(field, masked: false, privacy_settings: {})
    participant.display_value(field, masked: masked, privacy_settings: privacy_settings)
  end
end
