FactoryBot.define do
  factory :prize do
    association :event
    sequence(:name) { |n| "Prize #{n}" }
    prize_type { :gift }
    value { 1000 }
    quantity { 1 }
    sequence(:position) { |n| n }
    display_fields { ["name"] }
    privacy_settings { { "name" => true } }

    trait :cash do
      prize_type { :cash }
      taxable { true }
    end

    trait :drawn do
      drawn { true }
      drawn_at { Time.current }
    end
  end
end
