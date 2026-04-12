# Hive Workspace Restore Card

Keep this card after compact when you do not have a live Hive run. It is the smallest workspace-level restore surface.

- repo: chrome-proxy-timezone
- path: /Users/xin/Downloads/chrome-proxy-timezone
- branch: -
- goal: Resume work in chrome-proxy-timezone
- summary: No Hive run snapshot is available yet; use the plan and git diff as the restore surface.
- next: Open .ai/plan/current.md, inspect git status, then continue the most recent in-flight slice.
- conversation carry-over:
  - The user has a Chrome extension "Atlas Proxy" (Proxy & Timezone - Privacy Focused) that they want to publish to Chrome Web Store. They want to ensure their extension's capabilit...
  - Confirmed adding Claude-specific proxy rules won't cause Chrome Web Store rejection
  - Confirmed user's approach of no fallback is valid (prevents IP drift)
  - Identified 14 improvement suggestions for the extension (prioritized)
- changed files: clean or unavailable
- recover with:
  - hive restore
  - git status --short
  - git diff --stat
- deep sources:
  - .ai/restore/latest-compact-conversation.md

## Restore Prompt

```text
You are resuming work after compact/clear/new, but there is no active Hive run snapshot.
Use this workspace restore card as the smallest resume surface. Do not ask for a broad recap first.

Workspace: chrome-proxy-timezone
Path: /Users/xin/Downloads/chrome-proxy-timezone
Branch: -
Goal: Resume work in chrome-proxy-timezone
Summary: No Hive run snapshot is available yet; use the plan and git diff as the restore surface.
Next action: Open .ai/plan/current.md, inspect git status, then continue the most recent in-flight slice.

Conversation carry-over:
1. The user has a Chrome extension "Atlas Proxy" (Proxy & Timezone - Privacy Focused) that they want to publish to Chrome Web Store. They want to ensure their extension's capabilit...
2. Confirmed adding Claude-specific proxy rules won't cause Chrome Web Store rejection
3. Confirmed user's approach of no fallback is valid (prevents IP drift)
4. Identified 14 improvement suggestions for the extension (prioritized)
Changed files preview: clean or unavailable

Recovery order:
1. hive restore
2. git status --short
3. git diff --stat

Only if deeper context is needed, inspect these sources in order:
1. .ai/restore/latest-compact-conversation.md

If you need a true Hive run artifact later, start or resume through Hive and regenerate compact.
```
