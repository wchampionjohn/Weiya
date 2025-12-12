---
description: "Generate Rails model following project structure standards"
usage: "/model [ModelName] [options]"
tags: ["rails", "model", "generator"]
---

# Rails Model Generator

Generate a Rails model following the project's strict structure standards with proper section comments and organization.

## Quick Usage

```
/model Campaign name:string budget:decimal start_date:date end_date:date active:boolean
/model Deal deal_type:integer floor_price:decimal priority:integer deal_group:belongs_to
/model AdSpace venue_type:string is_active:boolean device:belongs_to
```

## Model Structure Standards

Generate models with the following mandatory structure comments:

```ruby
# frozen_string_literal: true

class ModelName < ApplicationRecord
  # extends ...................................................................
  
  # includes ..................................................................
  
  # security (i.e. attr_accessible) ...........................................
  
  # relationships .............................................................
  
  # validations ...............................................................
  
  # callbacks .................................................................
  
  # scopes ....................................................................
  
  # additional config .........................................................
  
  # class methods .............................................................
  
  # public instance methods ...................................................
  
  # protected instance methods ................................................
  protected
  
  # private instance methods ..................................................
  private
end
```

## Field Type Mapping

### Basic Types
- `string` → `validates :field, presence: true`
- `text` → `validates :field, presence: true`
- `integer` → `validates :field, presence: true, numericality: { greater_than: 0 }`
- `decimal` → `validates :field, presence: true, numericality: { greater_than: 0 }`
- `boolean` → `validates :field, inclusion: { in: [true, false] }`
- `date/datetime` → `validates :field, presence: true`

### Special Types
- `email` → `validates :field, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }`
- `url` → `validates :field, presence: true, format: { with: URI::DEFAULT_PARSER.make_regexp }`
- `enum:values` → `enum field: { value1: 0, value2: 1 }`

### Associations
- `belongs_to:model` → `belongs_to :model` + `validates :model, presence: true`
- `has_many:models` → `has_many :models, dependent: :destroy`
- `has_one:model` → `has_one :model, dependent: :destroy`

## Common Patterns

### DOOH Models
```
/model AdSpace venue_type:enum:indoor,outdoor floor_price:decimal is_active:boolean device:belongs_to
/model Campaign name:string budget:decimal start_date:date end_date:date advertiser:belongs_to
/model Deal deal_type:enum:pmp,pd floor_price:decimal priority:integer deal_group:belongs_to
```

### RTB Models
```
/model BidRequest request_id:string device_id:string timeout:integer
/model BidResponse bid_id:string price:decimal creative_url:url bid_request:belongs_to
/model Impression win_price:decimal served_at:datetime bid_response:belongs_to
```

## Generated Features

### Always Include
1. **Frozen string literal** at the top
2. **Complete structure comments** for organization
3. **Basic validations** based on field types
4. **Proper associations** with validation
5. **Standard scopes** (active, recent, etc.)
6. **Taggable concern** for models that need tags

### Model-Specific Features

#### For Campaign/Deal models:
- Budget validation
- Date range validation
- Status enum (draft, active, paused, completed)
- Active scope

#### For Device-related models:
- Location validations (latitude/longitude)
- Status enum (online, offline, maintenance)
- Active scope
- Heartbeat-related methods

#### For RTB models:
- Timeout validations
- Price validations (> 0)
- Proper decimal precision
- Performance-optimized queries

## Migration Generation

Also generates corresponding migration with:
- Proper column types and constraints
- Foreign key constraints
- Indexes for lookup fields
- Comments for field descriptions

## Examples

### Basic Model
```
/model Product name:string price:decimal description:text active:boolean
```

Generates:
- `app/models/product.rb` with structure
- Migration with proper constraints
- Basic validations and scopes

### Association Model
```
/model Order user:belongs_to total_amount:decimal status:enum:pending,paid,shipped
```

Generates:
- Belongs_to association with validation
- Enum for status
- Amount validation
- Order-specific scopes

### Complex DOOH Model
```
/model AdSpace venue_type:enum:indoor,outdoor,transit device:belongs_to floor_price:decimal tags
```

Generates:
- Enum for venue_type
- Taggable concern
- Price validations
- Device association
- DOOH-specific scopes

## Post-Generation

After model generation:
1. Run `bundle exec annotate` to add schema info
2. Run model structure check: `.claude/scripts/model-structure-check.sh`
3. Generate corresponding spec file
4. Update API documentation if needed

## Validation Rules

### Automatic Validations
- **presence**: All non-boolean fields
- **numericality**: Integer/decimal fields
- **format**: Email/URL fields
- **inclusion**: Boolean fields
- **association**: All belongs_to relationships

### Custom Validations
Add project-specific validations in the appropriate section:
- Geographic coordinates validation for location fields
- Business logic validations in custom methods
- Cross-field validations in private methods

## Best Practices

1. **Use descriptive names**: `AdSpace` not `Space`
2. **Follow conventions**: `is_active` for boolean flags
3. **Add indexes**: For all lookup fields
4. **Include scopes**: Common query patterns
5. **Validate associations**: All belongs_to relationships
6. **Use enums**: For fixed value sets
7. **Add comments**: Explain complex validations

Remember: This generates the foundation. Add business logic in the appropriate sections according to the model structure guide!