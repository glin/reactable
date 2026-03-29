---
name: agent-browser
description: Browser automation CLI for AI agents. Use when the user needs to interact with websites, including navigating pages, filling forms, clicking buttons, taking screenshots, extracting data, testing web apps, or automating any browser task. Triggers include requests to "open a website", "fill out a form", "click a button", "take a screenshot", "scrape data from a page", "test this web app", "automate browser actions", or any task requiring programmatic web interaction.
allowed-tools: Bash(npx agent-browser:*), Bash(agent-browser:*)
---

# Browser Automation with agent-browser

The CLI uses Chrome/Chromium via CDP directly. Run `agent-browser --help` for all commands.

## Core Workflow

Every browser automation follows this pattern:

1. **Navigate**: `agent-browser open <url>`
2. **Snapshot**: `agent-browser snapshot -i` (get element refs like `@e1`, `@e2`)
3. **Interact**: Use refs to click, fill, select
4. **Re-snapshot**: After navigation or DOM changes, get fresh refs

```bash
agent-browser --allow-file-access open file:///path/to/table.html
agent-browser wait --load networkidle
agent-browser snapshot -i
# Output: @e1 [columnheader] "Sort mpg", @e2 [columnheader] "Sort cyl", ...

agent-browser click @e1       # Sort by mpg
agent-browser snapshot -i     # Check sorted result
```

## Command Chaining

Commands can be chained with `&&` in a single shell invocation. The browser persists between commands via a background
daemon, so chaining is safe and more efficient than separate calls.

```bash
# Chain open + wait + snapshot in one call
agent-browser --allow-file-access open file:///path/to/table.html && agent-browser wait --load networkidle && agent-browser snapshot -i
```

**When to chain:** Use `&&` when you don't need to read the output of an intermediate command before proceeding (e.g.,
open + wait + screenshot). Run commands separately when you need to parse the output first (e.g., snapshot to discover
refs, then interact using those refs).

## Essential Commands

```bash
# Navigation
agent-browser open <url>              # Navigate (aliases: goto, navigate)
agent-browser close                   # Close browser

# Snapshot
agent-browser snapshot -i             # Interactive elements with refs (recommended)
agent-browser snapshot -s "#selector" # Scope to CSS selector

# Interaction (use @refs from snapshot)
agent-browser click @e1               # Click element
agent-browser fill @e2 "text"         # Clear and type text
agent-browser type @e2 "text"         # Type without clearing
agent-browser select @e1 "option"     # Select dropdown option
agent-browser press Enter             # Press key
agent-browser scroll down 500         # Scroll page
agent-browser scroll down 500 --selector "div.content"  # Scroll within a specific container

# Get information
agent-browser get text @e1            # Get element text
agent-browser get url                 # Get current URL
agent-browser get title               # Get page title

# Wait
agent-browser wait @e1                # Wait for element
agent-browser wait --load networkidle # Wait for network idle
agent-browser wait --text "Welcome"   # Wait for text to appear (substring match)
agent-browser wait --fn "!document.body.innerText.includes('Loading...')"  # Wait for condition
agent-browser wait "#spinner" --state hidden  # Wait for element to disappear

# Capture
agent-browser screenshot              # Screenshot to temp dir
agent-browser screenshot --full       # Full page screenshot
agent-browser screenshot --annotate   # Annotated screenshot with numbered element labels

# Diff (compare page states)
agent-browser diff snapshot                          # Compare current vs last snapshot
agent-browser diff snapshot --baseline before.txt    # Compare current vs saved file
agent-browser diff screenshot --baseline before.png  # Visual pixel diff
```

## Local Files

Always use `--allow-file-access` when opening local `file://` URLs. This is required for the widget's JavaScript to
load local resources.

```bash
agent-browser --allow-file-access open file:///path/to/page.html
```

## JavaScript Evaluation (eval)

Use `eval` to run JavaScript in the browser context. **Shell quoting can corrupt complex expressions** -- use `--stdin`
to avoid issues.

```bash
# Simple expressions work with regular quoting
agent-browser eval 'document.title'
agent-browser eval 'Reactable.getState("cars")'

# Complex JS: use --stdin with heredoc (RECOMMENDED)
agent-browser eval --stdin <<'EVALEOF'
JSON.stringify(Reactable.getState("cars"))
EVALEOF
```

## Ref Lifecycle (Important)

Refs (`@e1`, `@e2`, etc.) are invalidated when the page changes. Always re-snapshot after:

- Clicking links or buttons that navigate
- Form submissions
- Dynamic content loading (sorting, filtering, pagination)

```bash
agent-browser click @e5              # Sorts a column
agent-browser snapshot -i            # MUST re-snapshot to get new refs
agent-browser click @e1              # Use new refs
```

## Annotated Screenshots (Vision Mode)

Use `--annotate` to take a screenshot with numbered labels overlaid on interactive elements. Each label `[N]` maps to
ref `@eN`.

```bash
agent-browser screenshot --annotate
# Output includes the image path and a legend:
#   [1] @e1 columnheader "Sort mpg"
#   [2] @e2 columnheader "Sort cyl"
agent-browser click @e2              # Click using ref from annotated screenshot
```

## Diffing (Verifying Changes)

Use `diff snapshot` after performing an action to verify it had the intended effect.

```bash
agent-browser snapshot -i          # Take baseline snapshot
agent-browser click @e2            # Sort a column
agent-browser diff snapshot        # See what changed
```

## Visual Browser (Debugging)

```bash
agent-browser --headed open https://example.com
agent-browser highlight @e1          # Highlight element
agent-browser inspect                # Open Chrome DevTools
```

## Viewport

```bash
agent-browser set viewport 1920 1080          # Set viewport size (default: 1280x720)
```

## Deep-Dive Documentation

| Reference                                                  | When to Use                                        |
| ---------------------------------------------------------- | -------------------------------------------------- |
| [references/commands.md](references/commands.md)           | Full command reference with all options             |
| [references/snapshot-refs.md](references/snapshot-refs.md) | Ref lifecycle, invalidation rules, troubleshooting |
