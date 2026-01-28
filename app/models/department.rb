class Department < ApplicationRecord
  has_many :participants, dependent: :nullify

  validates :name, presence: true, uniqueness: true
  validates :code, presence: true, uniqueness: true

  scope :ordered, -> { order(:name) }

  def participants_count
    participants.count
  end
end
