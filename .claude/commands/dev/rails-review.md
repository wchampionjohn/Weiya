---
description: "Review Rails code for adherence to project standards"
usage: "/project:dev:rails-review [scope]"
tags: ["rails", "code-review", "quality"]
---

# Rails Code Reviewer

Review Rails code against project standards and best practices.

## Usage

```bash
/project:dev:rails-review              # Review all modified files
/project:dev:rails-review staged        # Review only staged files  
/project:dev:rails-review branch        # Review all changes in current branch
/project:dev:rails-review app/models/   # Review specific directory
/project:dev:rails-review app/models/deal.rb  # Review specific file
```

The rails-code-reviewer agent will automatically check your code against all project standards defined in `CLAUDE.md` and `docs/model-structure-guide.md`.