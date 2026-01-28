FactoryBot.define do
  factory :prize_type do
    name { "MyString" }
    code { "MyString" }
    is_default { false }
    position { 1 }
  end
end
