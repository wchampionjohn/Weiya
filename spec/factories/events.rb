FactoryBot.define do
  factory :event do
    sequence(:name) { |n| "Event #{n}" }
    event_date { 1.week.from_now }
    status { :draft }
    allow_repeat_win { false }
    required_fields { ["name", "employee_id"] }

    trait :active do
      status { :active }
    end

    trait :completed do
      status { :completed }
    end

    trait :with_password do
      password { "secret123" }
    end
  end
end
