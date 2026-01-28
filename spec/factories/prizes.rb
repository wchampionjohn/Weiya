FactoryBot.define do
  factory :prize do
    association :event
    sequence(:name) { |n| "Prize #{n}" }
    prize_type { nil }
    value { 1000 }
    quantity { 1 }
    sequence(:position) { |n| n }
    display_fields { ["name"] }
    privacy_settings { { "name" => true } }

    trait :with_prize_type do
      association :prize_type
    end

    trait :cash do
      association :prize_type, factory: :prize_type, code: 'cash'
      taxable { true }
    end

    trait :drawn do
      drawn { true }
      drawn_at { Time.current }
    end
  end
end
