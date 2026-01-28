class PrizeType < ApplicationRecord
  has_many :prizes, dependent: :nullify

  validates :name, presence: true
  validates :code, presence: true, uniqueness: true

  scope :ordered, -> { order(:position) }
  scope :defaults, -> { where(is_default: true) }
  scope :custom, -> { where(is_default: false) }

  def deletable?
    !is_default
  end

  def in_use?
    prizes.exists?
  end
end
