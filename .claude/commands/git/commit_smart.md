---
description: "Intelligently analyze changes and create atomic commits grouped by responsibility"
usage: "/commit-smart"
tags: ["git", "commit", "smart"]
---

# Smart Atomic Git Commits by Responsibility

Intelligently analyze all changed files and create multiple atomic commits grouped by responsibility, following Conventional Commits standards.

**I'll execute this workflow:**

1. **Analyze all changes** in the repository
2. **Group files** by logical responsibility/scope
3. **Create multiple commits** - one for each logical change
4. **Follow Conventional Commits** for all commit messages
5. **Execute commits in logical order**

## Security Check

I'll first check if `/app/controllers/main/controller.rb` has commented authentication:
- If `authenticate_user!` or `find_company!` are commented out, this file will be **excluded from all commits**

Let me start by analyzing all changes and grouping them into logical, atomic commits.