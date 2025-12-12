---
description: "Generate RSpec tests following project conventions"
usage: "/project:dev:spec <type> <name>"
tags: ["rspec", "testing", "generator"]
---

# RSpec Test Generator

Generate RSpec tests that follow project testing conventions.

## Usage
```
/project:dev:spec controller UsersController
/project:dev:spec model User
/project:dev:spec service UserRegistrationService
/project:dev:spec request "Main::Users"
```

## Testing Standards

### Model Tests
```ruby
RSpec.describe User, type: :model do
  subject { build(:user) }
  
  # Use one-liner syntax for simple tests
  it { is_expected.to be_valid }
  it { expect(subject.status).to eq(:active) }
  
  # Test business logic, not basic validations
  describe "#full_name" do
    it { expect(subject.full_name).to eq("#{subject.first_name} #{subject.last_name}") }
  end
end
```

### Controller Tests
```ruby
RSpec.describe Main::UsersController, type: :controller do
  before { sign_in_main }
  
  describe "GET #index" do
    subject { get :index }
    
    it { expect(response).to have_http_status(:success) }
    it { expect(assigns(:users)).to be_present }
  end
end
```

### Request Tests
```ruby
RSpec.describe "Main::Users", type: :request do
  before { sign_in_main }
  
  describe "GET /api/main/users" do
    subject do
      get "/api/main/users", headers: auth_headers
      JSON.parse(response.body, symbolize_names: true)
    end
    
    it { expect(response).to have_http_status(:success) }
    it { expect(subject[:users]).to be_present }
  end
end
```

### Service Tests
```ruby
RSpec.describe UserRegistrationService do
  subject { described_class.new(params) }
  
  let(:params) { { email: "user@example.com", password: "password" } }
  
  describe "#perform" do
    context "with valid parameters" do
      it { expect(subject.perform).to be_truthy }
      it { expect { subject.perform }.to change(User, :count).by(1) }
    end
  end
end
```

## What NOT to Test

Don't test basic Rails functionality:
- Basic validations (`validates_presence_of`)
- Basic associations (`belongs_to`, `has_many`)
- Simple attribute accessors

## Test Data

Use FactoryBot for test data:
```ruby
let!(:user) { create(:user) }
let(:users) { create_list(:user, 3) }
```

## Authentication Setup

For request specs requiring authentication:
```ruby
before { sign_in_main }  # For Main API
before { sign_in_rtb }   # For RTB API
```