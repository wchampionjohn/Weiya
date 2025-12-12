---
description: "Intelligently resolve git merge conflicts"
usage: "/git:resolve-conflicts"
tags: ["git", "conflicts", "merge"]
---

# Intelligent Git Conflict Resolution

Analyze and resolve git merge conflicts intelligently, preserving the intent of both branches.

**I'll execute this workflow:**

1. **Check conflict status** - Identify all files with merge conflicts
2. **Analyze each conflict** - Understand changes from both branches
3. **Resolve intelligently** - Merge changes based on context and purpose
4. **Validate resolution** - Run tests and linters after resolution
5. **Stage resolved files** - Add resolved files to git

## Resolution Strategy

For each conflicted file, I will:
- **Analyze both sides** of the conflict (ours vs theirs)
- **Understand the intent** of each change
- **Apply smart merging**:
  - Keep both changes if they're in different areas
  - Merge logically if they complement each other
  - Choose the more complete/recent implementation for overlaps
  - Ensure syntactic correctness after resolution

## Special Handling

**Rails-specific files:**
- `Gemfile.lock` - Run `bundle install` after resolution
- `db/schema.rb` - Take version with higher schema version
- `config/routes.rb` - Merge routes avoiding duplicates
- Migration files - Check dependencies and timestamps

## Post-Resolution

After resolving all conflicts:
1. Run tests: `bundle exec rspec`
2. Run linter: `bundle exec rubocop -a`
3. Verify no conflict markers remain
4. Prepare descriptive merge commit message

Let me start by checking the current conflict status.