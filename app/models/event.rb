class Event < ApplicationRecord
  enum :status, { draft: 0, active: 1, completed: 2 }

  has_many :prizes, dependent: :destroy
  has_many :event_participants, dependent: :destroy
  has_many :participants, through: :event_participants
  has_many :winners, through: :prizes

  validates :name, presence: true
  validates :event_date, presence: true
  validates :public_slug, uniqueness: true, allow_nil: true
  validate :required_fields_must_have_at_least_one

  scope :active_or_completed, -> { where(status: [:active, :completed]) }
  scope :published, -> { where.not(status: :draft) }

  def self.find_by_slug_or_id(identifier)
    find_by(public_slug: identifier) || find_by(id: identifier)
  end

  def generate_slug!
    loop do
      self.public_slug = SecureRandom.alphanumeric(12).downcase
      break unless Event.exists?(public_slug: public_slug)
    end
    save!
    public_slug
  end

  def clear_slug!
    update!(public_slug: nil)
  end

  def public_identifier
    public_slug.presence || id
  end

  def use_random_url?
    public_slug.present?
  end

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
