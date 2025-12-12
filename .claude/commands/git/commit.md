---
description: "Analyze changes and create a single conventional commit"
usage: "/commit"
tags: ["git", "commit", "conventional"]
---

# Intelligent Git Commit with Conventional Commits

Analyze all changed files and create a single well-structured commit following Conventional Commits standards.

**I'll execute this workflow:**

1. **Analyze all changes** in the repository
2. **Determine the primary type** of change (feat/fix/refactor/etc.)
3. **Create a single commit** with proper conventional commit format
4. **Follow project conventions** as defined in CLAUDE.md

## Security Check

I'll first check if `/app/controllers/main/controller.rb` has commented authentication:
- If `authenticate_user!` or `find_company!` are commented out, this file will be **excluded from the commit**

Let me start by checking the current git status and analyzing all changes to create an appropriate conventional commit.