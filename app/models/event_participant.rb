class EventParticipant < ApplicationRecord
  belongs_to :event
  belongs_to :participant
  has_many :winners, dependent: :destroy

  validates :event_id, presence: true
  validates :participant_id, presence: true
  validates :participant_id, uniqueness: { scope: :event_id, message: "已加入此活動" }

  scope :eligible_for, ->(prize) {
    scope = if prize.event.allow_repeat_win_for_prize?(prize)
      all
    else
      where.not(id: Winner.where(prize: prize.event.prizes).select(:event_participant_id))
    end

    # Apply eligibility rules if present (Phase 2)
    if prize.has_eligibility_rules?
      scope = scope.with_min_seniority(prize.event, prize.min_seniority_years)
      scope = scope.in_departments(prize.required_departments)
    end

    scope
  }

  scope :not_won_in_event, -> {
    where.not(id: Winner.select(:event_participant_id))
  }

  # Filter by minimum seniority years (Phase 2)
  scope :with_min_seniority, ->(event, min_years) {
    return all if min_years.blank? || min_years <= 0
    cutoff_date = event.event_date.to_date - min_years.years
    joins(:participant).where("participants.hire_date <= ?", cutoff_date)
  }

  # Filter by departments (Phase 2)
  scope :in_departments, ->(department_names) {
    return all if department_names.blank? || department_names.empty?
    department_ids = Department.where(name: department_names).pluck(:id)
    return none if department_ids.empty?
    joins(:participant).where(participants: { department_id: department_ids })
  }

  delegate :name, :employee_id, :phone, :email, :hire_date, :department, to: :participant

  def has_won?
    winners.exists?
  end

  def display_value(field, masked: false, privacy_settings: {})
    participant.display_value(field, masked: masked, privacy_settings: privacy_settings)
  end

  def seniority_years
    participant.seniority_years_for(event)
  end
end
