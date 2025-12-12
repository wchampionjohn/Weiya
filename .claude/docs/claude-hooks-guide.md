# Claude Hooks Complete Guide

## Quick Start

Copy `claude-hooks-rails.json` to your Claude settings directory:

```bash
# Mac/Linux
cp claude-hooks-rails.json ~/.config/claude/settings.json

# Windows
copy claude-hooks-rails.json %APPDATA%\claude\settings.json
```

Restart Claude Code to take effect.

## Hooks System Overview

### 1. Git Hooks (`.git/hooks/`)
- **Purpose**: Enforce code quality checks
- **Triggered**: During Git operations (commit, push, etc.)
- **Characteristics**: Blocks non-compliant code

### 2. Claude Hooks (`claude-hooks-rails.json`)
- **Purpose**: Real-time reminders and guidance during development
- **Triggered**: When Claude executes tools
- **Characteristics**: Non-blocking, only provides reminders

### 3. Shared Scripts (`.claude/shared/`)
- **Purpose**: Unified check logic
- **Usage**: Called by both Git hooks and Claude hooks
- **Characteristics**: Single source of truth

## Feature List

### 🛡️ Security Checks
- Prevent commenting out authentication methods (`authenticate_user!`)
- Prevent direct editing of `schema.rb`
- Detect hardcoded keys or URLs
- Warn about destructive database operations

### 📋 Development Assistance
- Remind to run `annotate` after Model modifications
- Show related routes after Controller modifications
- Remind to update API documentation after Serializer modifications
- Checklist after Migration completion

### 🐛 Code Quality
- Detect debug code (debugger, binding.pry)
- Detect Chinese comments
- Warn about possible N+1 queries
- Check Model structure integrity

## Environment Variables

Environment variables accessible to hooks:
- `$CLAUDE_PROJECT_DIR` - Project directory
- `$CLAUDE_PARAM_file_path` - File being edited
- `$CLAUDE_PARAM_command` - Command being executed
- `$CLAUDE_RESULT_stdout` - Command output
- `$CLAUDE_RESULT_exit_code` - Exit code

## Debugging Methods

```bash
# View hooks execution details
claude --debug

# Manually test shared scripts
.claude/shared/check_debug.sh app/models/device.rb
.claude/shared/check_auth.sh app/controllers/main/devices_controller.rb
.claude/shared/migration_status.sh
```

## Custom Hooks

Add to `claude-hooks-rails.json`:

```json
{
  "comment": "Your hook description",
  "matcher": "Edit|MultiEdit",
  "hooks": [{
    "type": "command",
    "command": "your check command"
  }]
}
```

## Related Files

- `claude-hooks-rails.json` - Claude hooks configuration for Rails projects
- `.claude/shared/` - Shared check scripts
- `.git/hooks/` - Git hooks (auto-installed)
- `docs/hooks-optimization-summary.md` - Optimization details