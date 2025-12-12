# Rails Testing Guide

## Testing Tools

- RSpec (main testing framework)
- FactoryBot (test data generation)
- Shoulda Matchers (model/association/validation matchers)

## Best Practices

### 1. Use `subject` for Test Clarity

Define `subject` to clearly indicate what is being tested. This improves readability and allows using `is_expected` for more concise assertions.

```ruby
# Define subject for the test
describe User do
  subject { build(:user, admin: true) }
  
  it "is an admin" do
    # Use is_expected for cleaner assertions
    is_expected.to be_admin
  end
  
  it "has a valid email" do
    is_expected.to have_attributes(email: be_present)
  end
end

# For service objects or methods with return values
describe ResourceService do
  subject { described_class.new(resource).perform }
  
  it { is_expected.to be_truthy }
  it { is_expected.to eq(expected_result) }
  
  # For testing side effects
  it "activates the resource" do
    expect { subject }.to change { resource.reload.active? }.to(true)
  end
end
```

### 2. Use `subject` to Return JSON Response in Request Specs

In request specs, define `subject` to perform the HTTP request and return the parsed JSON response. This makes tests more readable and eliminates the need to call `JSON.parse` in each test.

```ruby
describe "GET /api/resources" do
  subject do
    get "/api/resources", headers: auth_headers
    JSON.parse(response.body, symbolize_names: true)
  end
  
  it { expect(response).to have_http_status(:success) }
  
  it "returns resources data" do
    expect(subject[:resources]).to be_present
    expect(subject[:resources].first[:id]).to eq(resource.id)
  end
end
```

### 3. Use `let!` for Required Test Data Setup

Use `let!` instead of `before` blocks when preparing test data that needs to be available before the test runs. This makes the data dependencies explicit and improves test readability.

```ruby
# Not recommended
before { create(:resource, name: "Test Resource") }

# Recommended
let!(:resource) { create(:resource, name: "Test Resource") }
```

### 4. Use Predicate Matchers

Always prefer predicate matchers (`be_truthy`, `be_falsy`, `be_active`, etc.) over explicit comparisons when testing boolean or state conditions.

```ruby
# Not recommended
expect(user.active?).to eq(true)
expect(user.admin?).to eq(false)

# Recommended
expect(user).to be_active
expect(user).not_to be_admin
```

### 5. Use `change` Matcher for State Changes

Always use the `change` matcher when testing methods that modify state, rather than comparing before and after values.

```ruby
# Not recommended
count = User.count
create_user
expect(User.count).to eq(count + 1)

# Recommended
expect { create_user }.to change(User, :count).by(1)
expect { update_user(user, admin: true) }.to change(user, :admin?).from(false).to(true)
expect { process }.to change { user.reload.status }.to("approved")
```

### 6. Use One-Line Syntax Appropriately

Follow these guidelines for when to use one-line syntax:

1. **Use one-line syntax** for simple expectations with a single assertion:
```ruby
# Single assertion tests
it { is_expected.to be_active }
it { is_expected.to have_http_status(:success) }
it { expect { create_user }.to change(User, :count).by(1) }
it { expect(user.reload.name).to eq("Updated Name") }
```

2. **Use traditional multi-line format** for tests with multiple assertions:
```ruby
# Multiple assertions
it "returns the resource with correct attributes" do
  expect(subject[:resource]).to be_present
  expect(subject[:resource][:name]).to eq("Test Resource")
  expect(subject[:resource][:status]).to eq("active")
end
```

This approach improves readability by keeping simple tests concise while providing clarity for more complex tests.

### 7. Separate Test Concerns in Request Specs

When testing controller actions that modify state, separate database change tests from response tests:

```ruby
describe "POST /api/resources" do
  let(:valid_params) { { name: "New Resource" } }
  
  # Test database changes separately
  describe "database changes" do
    subject { post "/api/resources", params: valid_params, headers: auth_headers }
    
    it { expect { subject }.to change(Resource, :count).by(1) }
    it { expect { subject }.to change(Activity, :count).by(1) }
  end
  
  # Test response separately
  context "response and attributes" do
    before { post "/api/resources", params: valid_params, headers: auth_headers }
    
    subject { JSON.parse(response.body, symbolize_names: true) }
    
    it { expect(response).to have_http_status(:success) }
    
    it "returns the created resource" do
      expect(subject[:resource]).to be_present
      expect(subject[:resource][:name]).to eq("New Resource")
    end
  end
end
```

This structure:
- Improves test clarity by separating concerns
- Reduces code duplication by using `subject` for the HTTP request
- Makes tests more maintainable and easier to understand
- Ensures accurate testing of both database changes and API responses

## Model Test Example

```ruby
# frozen_string_literal: true

RSpec.describe ModelName, type: :model do
  describe "validation" do
    subject { build(:model_name) }

    it { is_expected.to validate_presence_of(:attribute) }
    it { is_expected.to validate_numericality_of(:number).is_greater_than_or_equal_to(0) }
  end

  describe "associations" do
    it { is_expected.to belong_to(:parent) }
    it { is_expected.to have_many(:children) }
  end

  describe "scopes" do
    let!(:active_record) { create(:model_name, is_active: true) }
    let!(:inactive_record) { create(:model_name, is_active: false) }

    it "filters active records" do
      expect(ModelName.active).to include(active_record)
      expect(ModelName.active).not_to include(inactive_record)
    end
  end
  
  describe "#activate" do
    let(:record) { create(:model_name, is_active: false) }
    
    it "activates record" do
      expect { record.activate }.to change(record, :is_active?).from(false).to(true)
    end
    
    it "updates status" do
      expect { record.activate }.to change { record.status }.to("active")
    end
  end
end
```

## Request Test Example

```ruby
# frozen_string_literal: true

RSpec.describe "Api::V1::Resources", type: :request do
  describe "GET /api/v1/resources" do
    let!(:resources) { create_list(:resource, 3) }

    subject do
      get "/api/v1/resources"
      JSON.parse(response.body, symbolize_names: true)
    end

    it { expect(response).to have_http_status(:ok) }

    it "returns resource list" do
      expect(subject[:resources].size).to eq(3)
    end
  end

  describe "POST /api/v1/resources" do
    let(:valid_params) { { resource: attributes_for(:resource) } }
    let(:invalid_params) { { resource: attributes_for(:resource, name: nil) } }

    context "with valid parameters" do
      # Test database changes
      describe "database changes" do
        subject { post "/api/v1/resources", params: valid_params }
        
        it { expect { subject }.to change(Resource, :count).by(1) }
      end
      
      # Test response
      context "response" do
        before { post "/api/v1/resources", params: valid_params }
        
        subject { JSON.parse(response.body, symbolize_names: true) }
        
        it { expect(response).to have_http_status(:created) }
        
        it "returns the created resource" do
          expect(subject[:resource]).to be_present
          expect(subject[:resource][:name]).to eq(valid_params[:resource][:name])
        end
      end
    end

    context "with invalid parameters" do
      # Test database changes
      describe "database changes" do
        subject { post "/api/v1/resources", params: invalid_params }
        
        it { expect { subject }.not_to change(Resource, :count) }
      end
      
      # Test response
      context "response" do
        before { post "/api/v1/resources", params: invalid_params }
        
        subject { JSON.parse(response.body, symbolize_names: true) }
        
        it { expect(response).to have_http_status(:unprocessable_entity) }
        it { expect(subject[:errors]).to be_present }
      end
    end
  end
end
```

## Service Test Example

```ruby
# frozen_string_literal: true

RSpec.describe ResourceActivationService, type: :service do
  describe "#perform" do
    let(:resource) { create(:resource, is_active: false) }
    subject { described_class.new(resource: resource).perform }
    
    it { is_expected.to be_truthy }
    
    it { expect { subject }.to change { resource.reload.is_active? }.from(false).to(true) }
    
    it { expect { subject }.to change { resource.reload.status }.to("active") }
    
    context "with invalid resource" do
      let(:resource) { nil }
      
      it { is_expected.to be_falsey }
    end
  end
end
```

## Additional Guidelines

### 1. Test Organization

- Group related tests together using `describe` and `context` blocks
- Use `describe` for methods (`describe '#method_name'` for instance methods, `describe '.method_name'` for class methods)
- Use `context` for different states or conditions (prefer `with_` or `when_` prefixes)

### 2. Naming Conventions

- Use descriptive names for test blocks that explain the behavior being tested
- Use present tense for test descriptions
- Use descriptive `it` blocks for complex tests to explain the expected behavior
- Prefix class methods with `.`, instance methods with `#` in descriptions

### 3. JSON Response Testing

- Use `symbolize_names: true` when parsing JSON responses
- Use predicate matchers (`be_present`, `be_truthy`, `be_falsey`) for boolean values
- Test for the presence of keys before testing their values
- Use `eq` for exact value matching, `include` for partial matching

### 4. Test Data Setup

- Use `let!` for required test data that must exist before the test runs
- Use `let` for lazy-loaded test data that's only created when referenced
- Keep test data minimal and focused on what's being tested
- Use factories with traits for common test data patterns

### 5. Testing Best Practices

- Keep tests independent and focused on a single piece of functionality
- Use mocking and stubbing judiciously to isolate dependencies
- Test for both happy paths and error scenarios
- Use `expect` instead of `assert` for more readable tests