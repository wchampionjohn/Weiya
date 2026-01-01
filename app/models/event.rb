class Event < ApplicationRecord
  enum :status, { draft: 0, active: 1, completed: 2 }

  has_many :prizes, dependent: :destroy
  has_many :event_participants, dependent: :destroy
  has_many :participants, through: :event_participants
  has_many :winners, through: :prizes

  validates :name, presence: true
  validates :event_date, presence: true
  validate :required_fields_must_have_at_least_one

  scope :active_or_completed, -> { where(status: [:active, :completed]) }
  scope :published, -> { where.not(status: :draft) }

  def editable?
    draft?
  end

  def can_modify_prize?(prize)
    draft? || (active? && !prize.drawn?)
  end

  def allow_repeat_win_for_prize?(prize)
    prize.allow_repeat_win_override.nil? ? allow_repeat_win : prize.allow_repeat_win_override
  end

  def has_password?
    password.present?
  end

  def participants_count
    event_participants.count
  end

  def prizes_count
    prizes.count
  end

  private

  def required_fields_must_have_at_least_one
    return if required_fields.is_a?(Array) && required_fields.any?

    errors.add(:required_fields, "必須至少選擇一個必填欄位")
  end
end
