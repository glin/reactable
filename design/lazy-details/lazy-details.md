# Native lazy row details

Introduced in development version 0.4.5.9000. Opt in with `lazyDetails = TRUE` in an active Shiny session.
The public API remains `reactableOutput()`, `renderReactable()` and `reactable()`, including nested tables.
R detail callbacks continue to receive the original one-based row index and column name.

## Execution and ownership

Construction retains R callbacks in a session-owned registry, replacing serialized detail content with a lazy marker.
A single session observer accepts batches of open, close and dispose requests. Each table construction receives a
unique identity. Requests contain a table identity, unique panel request identity, original row index and column.
Callbacks execute in their owning module's reactive domain, isolated from reactive invalidation. Native `renderUI()`
outputs handle dependencies, HTML widgets and Shiny bindings. No caller-supplied wrappers are required.

Each parent panel owns registrations made by nested `reactable()` calls inside its callback. Closing a panel removes
its output and recursively destroys descendant registrations. Rerendering a named output invalidates the previous
registry entry immediately. Browser replies are matched to both table and request identity; obsolete replies are ignored.
Ordinary callback errors appear inside the panel, respecting `shiny.sanitize.errors`; `req()` and `validate()` remain quiet.

An expanded panel retains its DOM while paginated or virtualized out of view. This retains the live open panel, not a
cache for closed panels. Collapse or switching detail columns releases it. Reopening calculates a fresh snapshot.
A native lifecycle observer handles Shiny removing dynamic UI without unmounting the widget. CSS-hidden routes remain alive.

## Initial boundaries

- Requires Shiny 1.5.0 or later. Static HTML cannot evaluate arbitrary R callbacks after rendering.
- Rerender to replace data. `updateReactable(data = ...)` and JavaScript `setData()` are rejected for lazy tables because
  existing callback closures may capture the previous dataset. State-only `updateReactable()` remains available.
- Server-side data processing and static server rendering are not supported with lazy details in this first version.
- All eligible rows show an expander. A callback that returns `NULL` results in an empty panel; discovering that in
  advance would require evaluating the callback eagerly.
- Open details are snapshots. Reactive changes do not automatically rerun an open callback. Close and reopen to refresh.
- Do not cache rendered lazy widgets with `bindCache()`: cached widget identities cannot restore disposed callbacks.
- Computation is synchronous in R. A long callback still occupies that Shiny R process; the option postpones work but
  does not move it to a background worker or cancel an already executing R call.
- Nested lazy tables must be constructed directly inside a lazy details callback. Eager details and cells reject
  embedded lazy tables because their serialized registrations cannot be recreated on reopening. Arbitrary application-created
  observers or separately registered Shiny outputs remain the application's responsibility.

## Accessibility

Existing expander keyboard interaction and `aria-expanded` behavior are preserved. Pending content uses `role="status"`
and `aria-busy`; callback errors use `role="alert"`. Loading finishes after Shiny renders the output or reports an error.
A dedicated output binding delegates to Shiny’s native HTML renderer and releases bindings if asynchronous dependency loading finishes after collapse.
Widgets whose dependencies finish offscreen initialize when their retained panel returns to view.

## Test plan

### Small nested example

For a small three-level example, install this checkout and run
`shiny::runApp("design/lazy-details/app.R")`. Expand a car, a system, and individual checks. The calculation log should
start at zero, grow once per opening, and stay unchanged when closing a panel. Closing a parent removes its descendants;
reopening starts fresh. "Recreate tables" should close every panel without calculating any new details.

With the app running, `python3 design/lazy-details/test-nested-app.py http://127.0.0.1:3847` runs browser checks using
Python Playwright and Chromium. It checks three-level nesting, reopening, sibling panels, table recreation, and opening
all 36 leaf panels on the first page before collapsing their parents.

Run `test-lazy-reactable.R` in a fresh R session. It installs the feature branch, or a local checkout selected by
`REACTABLE_LOCAL_SOURCE`. Check zero initial calls, nested expansion, reopen timestamps, sorting, paging, refreshed data,
error recovery, independent tables, module namespaces and virtual scrolling. Download the event report with session details.

Automated R tests cover deferred evaluation, unchanged eager behavior, invalid request validation, duplicate suppression,
reactive isolation and recursive cleanup. JavaScript tests cover request identity, batching, sorting, stale replies,
retained DOM and column switching. Run the existing R and JS suites as well as these new tests.

### Delayed dependency lifecycle

Run `shiny::runApp("design/lazy-details/lifecycle-app.R")`, then
`python3 design/lazy-details/test-lifecycle-app.py http://127.0.0.1:3847` with Shiny 1.7.5 or later. The test delays a
script dependency, collapses the panel, and verifies that no inputs remain bound to its detached content. It then
checks reopening and nested expansion, plus initialization after a dependency finishes while the panel is paged out.
