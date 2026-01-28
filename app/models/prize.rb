class Prize < ApplicationRecord
  belongs_to :event
  belongs_to :prize_type, optional: true
  belongs_to :drawer, class_name: "Admin", foreign_key: :drawn_by, optional: true
  has_many :winners, dependent: :destroy

  validates :name, presence: true
  validates :value, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :quantity, presence: true, numericality: { greater_than: 0 }
  validates :position, presence: true
  validate :designated_participants_within_quantity

  before_save :set_taxable_for_cash

  scope :undrawn, -> { where(drawn: false) }
  scope :drawn, -> { where(drawn: true) }
  scope :ordered, -> { order(:position) }
  scope :bonus, -> { where(is_bonus: true) }
  scope :regular, -> { where(is_bonus: false) }
  scope :scheduled, -> { where.not(scheduled_at: nil).order(:scheduled_at) }

  def remaining_quantity
    quantity - winners.count
  end

  def can_draw?
    !drawn? && remaining_quantity.positive?
  end

  def has_designated_participants?
    designated_participant_ids.present? && designated_participant_ids.any?
  end

  def designated_participants
    return [] unless has_designated_participants?
    Participant.where(id: designated_participant_ids)
  end

  def has_eligibility_rules?
    eligibility_rules.present? && eligibility_rules.any?
  end

  def min_seniority_years
    eligibility_rules&.dig("min_seniority_years")
  end

  def required_departments
    eligibility_rules&.dig("departments") || []
  end

  # Insert bonus prize after the latest drawn prize (Phase 2)
  def insert_after_latest_drawn
    latest_drawn = event.prizes.drawn.order(drawn_at: :desc).first

    if latest_drawn
      new_position = latest_drawn.position + 1
      # Shift subsequent undrawn prizes
      event.prizes.undrawn.where("position >= ?", new_position).update_all("position = position + 1")
      self.position = new_position
    else
      # No prizes drawn yet, add at the end
      self.position = (event.prizes.maximum(:position) || 0) + 1
    end
  end

  private

  def set_taxable_for_cash
    self.taxable = true if prize_type&.code == 'cash'
  end

  def designated_participants_within_quantity
    return unless designated_participant_ids.present?
    if designated_participant_ids.length > quantity
      errors.add(:designated_participant_ids, "指定中獎人數量不能超過獎品數量 (#{quantity})")
    end
  end
end
