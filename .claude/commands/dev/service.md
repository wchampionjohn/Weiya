---
description: "Generate Service Object following project patterns"
usage: "/project:dev:service <service_name> [purpose]"
tags: ["rails", "service", "generator"]
---

# Service Object Generator

Generate Service Object that follows project conventions and inherits from BaseService.

## Usage
```
/project:dev:service UserRegistration "Handle user registration with email verification"
```

## Generated Structure
```ruby
class UserRegistrationService < BaseService
  attr_reader :email, :password, :result
  
  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, presence: true, length: { minimum: 8 }
  
  def initialize(email:, password:)
    @email = email
    @password = password
  end
  
  def perform
    return false unless valid?
    
    ActiveRecord::Base.transaction do
      create_user
      send_verification_email
      true
    rescue => e
      errors.add(:base, e.message)
      false
    end
  end
  
  private
  
  def create_user
    @result = User.create!(
      email: email,
      password: password,
      status: :pending_verification
    )
  end
  
  def send_verification_email
    UserMailer.verification_email(result).deliver_later
  end
end
```

## Service Responsibilities
- Orchestrating multiple models
- Transaction management
- Cross-model validations
- External API integrations
- Complex business rule coordination

## Testing Pattern
```ruby
RSpec.describe UserRegistrationService do
  subject { described_class.new(email: email, password: password) }
  
  let(:email) { "user@example.com" }
  let(:password) { "secure_password" }
  
  describe "#perform" do
    context "with valid parameters" do
      it { expect(subject.perform).to be_truthy }
      it { expect { subject.perform }.to change(User, :count).by(1) }
    end
    
    context "with invalid email" do
      let(:email) { "invalid" }
      it { expect(subject.perform).to be_falsey }
    end
  end
end
```