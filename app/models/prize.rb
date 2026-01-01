class Prize < ApplicationRecord
  enum :prize_type, { cash: 0, gift: 1 }

  belongs_to :event
  belongs_to :drawer, class_name: "Admin", foreign_key: :drawn_by, optional: true
  has_many :winners, dependent: :destroy

  validates :name, presence: true
  validates :value, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :quantity, presence: true, numericality: { greater_than: 0 }
  validates :prize_type, presence: true
  validates :position, presence: true

  before_save :set_taxable_for_cash

  scope :undrawn, -> { where(drawn: false) }
  scope :drawn, -> { where(drawn: true) }
  scope :ordered, -> { order(:position) }

  def remaining_quantity
    quantity - winners.count
  end

  def can_draw?
    !drawn? && remaining_quantity.positive?
  end

  private

  def set_taxable_for_cash
    self.taxable = true if cash?
  end
end
