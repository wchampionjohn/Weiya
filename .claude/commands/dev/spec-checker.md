# Spec Checker

Automatically checks and fixes failing RSpec tests following project testing standards.

## Usage

```
/dev:spec-checker [target]
```

### Examples

```bash
# Check all modified files
/dev:spec-checker

# Check staged files  
/dev:spec-checker staged

# Check entire branch
/dev:spec-checker branch

# Check specific directory/file
/dev:spec-checker app/models/
/dev:spec-checker app/models/deal.rb
```

## Implementation

This command invokes the `spec-checker` subagent which:
1. Identifies and runs relevant tests based on the target
2. Analyzes any failures
3. Automatically fixes tests to match project standards in `.claude/docs/rails-testing-guide.md`
4. Verifies all tests pass after fixes

The spec-checker agent ensures test suite health and compliance with project conventions.