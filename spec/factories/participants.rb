FactoryBot.define do
  factory :participant do
    association :event
    sequence(:name) { |n| "Participant #{n}" }
    sequence(:employee_id) { |n| "E#{n.to_s.rjust(4, '0')}" }
    sequence(:phone) { |n| "091234#{n.to_s.rjust(4, '0')}" }
    sequence(:email) { |n| "participant#{n}@example.com" }
  end
end
