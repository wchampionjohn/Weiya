---
description: "Optimize database queries and eliminate N+1 problems"
usage: "/project:dev:query [model_name]"
tags: ["database", "optimization", "n1", "performance"]
---

# Database Query Optimization

Optimize database queries, eliminate N+1 problems, and improve performance.

## Usage
```
/project:dev:query Device
/project:dev:query "check all controllers"
```

## Common N+1 Problems

### Problem: Loading associations in loops
```ruby
# BAD: N+1 query
devices = Device.all
devices.each do |device|
  puts device.screens.count  # This triggers a query for each device
end
```

### Solution: Use includes/joins
```ruby
# GOOD: Single query with includes
devices = Device.includes(:screens)
devices.each do |device|
  puts device.screens.size  # Uses loaded association
end
```

## Optimization Patterns

### 1. Eager Loading
```ruby
# Load associated data upfront
devices = Device.includes(:screens, :location, :ad_spaces)

# For complex associations
devices = Device.includes(
  screens: [:screen_blocks],
  ad_spaces: [:ad_units]
)
```

### 2. Counter Cache
```ruby
# Add to migration
add_column :devices, :screens_count, :integer, default: 0

# In model
class Device < ApplicationRecord
  has_many :screens, counter_cache: true
end

class Screen < ApplicationRecord
  belongs_to :device, counter_cache: true
end

# Usage
device.screens_count  # No query needed
```

### 3. Selective Loading
```ruby
# Only load what you need
Device.select(:id, :name, :is_active)
      .where(is_active: true)
      .includes(:screens)
```

### 4. Scoped Associations
```ruby
class Device < ApplicationRecord
  has_many :screens
  has_many :active_screens, -> { where(is_active: true) }, class_name: 'Screen'
end

# Usage
device.active_screens  # Pre-filtered
```

## Index Strategy

### Common Indexes Needed
```ruby
# Foreign keys
add_index :screens, :device_id
add_index :devices, :country_id

# Lookup columns
add_index :devices, :is_active
add_index :devices, [:is_active, :country_id]

# Polymorphic associations
add_index :ad_units, [:ad_unitable_type, :ad_unitable_id]

# JSON columns (PostgreSQL)
add_index :devices, :metadata, using: :gin
```

## Query Analysis Tools

### Find N+1 Queries
```ruby
# In development environment
config.active_record.strict_loading_by_default = true

# Or per query
Device.strict_loading.includes(:screens)
```

### Explain Queries
```ruby
# Check query plan
Device.includes(:screens).explain

# In Rails console
Device.joins(:screens).where(screens: { is_active: true }).explain
```

## Controller Optimization

### Before: N+1 Problem
```ruby
def index
  @devices = Device.all
  # Each device will trigger queries for screens, location, etc.
end
```

### After: Optimized
```ruby
def index
  @devices = Device.includes(:screens, :location)
                   .where(is_active: true)
                   .order(:created_at)
                   .page(params[:page])
end
```

## Serializer Optimization

### Avoid N+1 in Serializers
```ruby
class DeviceSerializer
  include FastJsonapi::ObjectSerializer
  
  attributes :name, :status
  
  # This will cause N+1
  attribute :screens_count do |device|
    device.screens.count
  end
  
  # Better: Use counter_cache or preload
  attribute :screens_count, &:screens_count
end
```

## Performance Monitoring

### Log Slow Queries
```ruby
# config/environments/development.rb
config.active_record.logger = Logger.new(STDOUT)
config.log_level = :debug
```

### Bullet Gem (Development)
```ruby
# Gemfile
gem 'bullet', group: :development

# config/environments/development.rb
config.after_initialize do
  Bullet.enable = true
  Bullet.alert = true
  Bullet.bullet_logger = true
end
```