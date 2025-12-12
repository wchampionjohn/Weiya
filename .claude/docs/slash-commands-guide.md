# Custom Slash Commands Usage Guide

This project is configured with slash commands specifically designed for daily development tasks, reducing repetitive descriptions of the same requirements.

## Most Commonly Used Slash Commands (Daily Use)

### 1. `/crud` - CRUD Code Generator ⭐️
Quickly generate complete CRUD structures that comply with project standards.

**When to use**:
- Creating new resource management features
- Need standard index/show/update/destroy operations
- Includes pagination, search, and sorting

**Example**:
```
/crud Create complete CRUD for Campaign with fields name, budget, start_date, end_date, and tag functionality
```

### 2. `/service` - Service Object Generator ⭐️
Create Service Objects for complex business logic.

**When to use**:
- Complex creation/update logic
- Cross-model transaction processing
- Operations requiring validation and error handling

**Example**:
```
/service Create AdSpaceCreationService that needs to create ad_space and associate multiple screens simultaneously
```

### 3. `/spec` - Test Generator ⭐️
Generate corresponding RSpec tests for various file types.

**When to use**:
- Writing tests for new features
- Supports all types: controller, model, service, form, etc.
- Can use file path or type + name

**Examples**:
```
/spec controller Main::DevicesController
/spec service BidRequestService
/spec form DeviceScheduleForm
/spec app/models/device.rb
```

### 4. `/association` - Association Management Expert ⭐️
Handle complex many-to-many association updates.

**When to use**:
- Updating has_many through associations
- Handling association add/remove logic
- Optimizing association queries

**Example**:
```
/association How to update ad_space's screens association? Keep existing ones, add new ones, remove unwanted ones
```

### 5. `/query` - Query Optimization Expert ⭐️
Optimize ActiveRecord query performance.

**When to use**:
- Solving N+1 queries
- Creating complex query scopes
- Optimizing paginated searches

**Example**:
```
/query This query is slow, how to add appropriate includes and indexes?
```

## Other Specialized Commands

### `/rtb` - RTB Expert Assistant
Handle OpenRTB protocol-related implementations.

### `/deal` - Deal Management Expert
Handle complex Deal priority and budget control logic.

### `/optimize` - Performance Optimization Expert
Overall performance analysis and optimization suggestions.

### `/apidoc` - API Documentation Generator
Generate OpenAPI specification documentation.

## Existing Built-in Commands

In addition to custom commands, these built-in ones are available:

- `/refactor_to_service` - Refactor code to service object
- `/rtb_optimization` - RTB optimization checklist

## How to Add New Slash Commands

1. Create a new `.md` file in the `.claude/prompts/` directory
2. The filename becomes the command name (e.g., `analytics.md` → `/analytics`)
3. Define the prompt content and guidelines in the file

## Best Practices

1. **Be specific with requirements**: Be as specific as possible when using slash commands
2. **Provide context**: Include relevant code or file paths
3. **Combine usage**: Use multiple commands for complex tasks

## Example Workflows

### Implementing new RTB functionality:
```
1. /rtb Design a bid request processing flow that supports header bidding
2. /spec service HeaderBiddingService
3. /optimize Check implementation performance and optimize
4. /apidoc rtb header_bidding
```

### Optimizing existing Deal functionality:
```
1. /deal Analyze existing deal selection logic
2. /optimize Identify performance bottlenecks
3. /spec service DealSelectionService
```