FactoryBot.define do
  factory :winner do
    association :prize
    association :event_participant
    drawn_at { Time.current }
    distributed { false }

    trait :distributed do
      distributed { true }
      distributed_at { Time.current }
    end
  end
end
