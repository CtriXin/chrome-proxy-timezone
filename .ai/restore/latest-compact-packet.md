# Hive Workspace Restore Card

Keep this card after compact when you do not have a live Hive run. It is the smallest workspace-level restore surface.

- repo: chrome-proxy-timezone
- path: /Users/xin/Downloads/chrome-proxy-timezone
- branch: main
- goal: Resume work in chrome-proxy-timezone
- summary: 14 changed files are still in flight.
- next: Open .ai/plan/current.md, inspect git status, then continue the most recent in-flight slice.
- conversation carry-over:
  - The user has a Chrome extension "Atlas Proxy" (Proxy & Timezone - Privacy Focused). They wanted to implement 14 improvement suggestions (9-14 plus ip.net.coffee feature gaps) in...
  - After the implementation, the user reported a **critical regression**: proxy switching is completely broken. "不是 现在我切换别的节点 还是我电脑的网络ip" - switching proxy nodes no longer routes t...
  - Successfully implemented all 14 improvement suggestions and ip.net.coffee feature gap additions
  - BUT created a critical regression where proxy switching is broken
- changed files:
  - M .ai/restore/latest-compact-conversation.json
  - M .ai/restore/latest-compact-conversation.md
  - M .ai/restore/latest-compact-packet.json
  - M .ai/restore/latest-compact-packet.md
  - M .ai/restore/latest-compact-restore-prompt.md
  - M .ai/restore/workspace-compact-packet.json
  - M .ai/restore/workspace-compact-packet.md
  - M .ai/restore/workspace-compact-restore-prompt.md
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
Branch: main
Goal: Resume work in chrome-proxy-timezone
Summary: 14 changed files are still in flight.
Next action: Open .ai/plan/current.md, inspect git status, then continue the most recent in-flight slice.

Conversation carry-over:
1. The user has a Chrome extension "Atlas Proxy" (Proxy & Timezone - Privacy Focused). They wanted to implement 14 improvement suggestions (9-14 plus ip.net.coffee feature gaps) in...
2. After the implementation, the user reported a **critical regression**: proxy switching is completely broken. "不是 现在我切换别的节点 还是我电脑的网络ip" - switching proxy nodes no longer routes t...
3. Successfully implemented all 14 improvement suggestions and ip.net.coffee feature gap additions
4. BUT created a critical regression where proxy switching is broken
Changed files preview:
1. M .ai/restore/latest-compact-conversation.json
2. M .ai/restore/latest-compact-conversation.md
3. M .ai/restore/latest-compact-packet.json
4. M .ai/restore/latest-compact-packet.md
5. M .ai/restore/latest-compact-restore-prompt.md
6. M .ai/restore/workspace-compact-packet.json
7. M .ai/restore/workspace-compact-packet.md
8. M .ai/restore/workspace-compact-restore-prompt.md

Recovery order:
1. hive restore
2. git status --short
3. git diff --stat

Only if deeper context is needed, inspect these sources in order:
1. .ai/restore/latest-compact-conversation.md

If you need a true Hive run artifact later, start or resume through Hive and regenerate compact.
```
