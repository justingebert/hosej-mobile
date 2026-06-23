# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v55.0.0/ before writing any code.

The exisitng Webapplication Hosej lives: /Users/justingebert/Projects/Personal/HoseJ/hosej

when using Icons use lucide-react-native icons

# Data Fetching & Screen States

Server state flows through React Query hooks in `src/lib/api/*` (one query-key
factory per resource). Screens render loading/error/empty with **explicit,
in-place branches** — no render-prop wrappers, no hidden control flow. The
repeated views are shared primitives in `src/components/ui/`; reuse them instead
of hand-rolling per screen:

- `Screen` — scrollable container with themed background + optional
  pull-to-refresh. Pass `onRefresh={refetch}` and `refreshing={isRefetching}`.
- `ErrorCard` — the single error view for a failed query. Renders where the
  content would be, with an optional retry button. Props: `title`, `error`,
  `onRetry`, `isRetrying`.
- `EmptyState` — "no content yet" (distinct from an error). Props: `title`,
  optional `description`.
- `Skeleton` — placeholder-bar primitive. Compose into a content-shaped
  skeleton kept **local** to each screen.

Standard query screen:

```tsx
const { data, error, isError, isPending, isRefetching, refetch } = useThing();
const items = data?.items ?? [];

return (
  <Screen onRefresh={refetch} refreshing={isRefetching}>
    {isPending ? (
      <ThingSkeleton />
    ) : isError ? (
      <ErrorCard title="Could not load things" error={error} onRetry={refetch} isRetrying={isRefetching} />
    ) : items.length === 0 ? (
      <EmptyState title="No things yet" />
    ) : (
      <ThingList items={items} />
    )}
  </Screen>
);
```

Rules:
- Skeletons are layout-specific → keep them local (built from `Skeleton`).
  Error/empty views are shared → never copy them into a screen.
- **Query** error → `ErrorCard` (the content is missing). **Mutation/action**
  error → transient feedback (toast), not a card — the screen content is still
  valid. (Toast lib not chosen yet; mutation forms show inline error text for now.)

# UI Components

Reusable primitives live in `src/components/ui/`, styled with uniwind
(`className`). The base set (`Text`, `Button`, `Card`) is copied from React
Native Reusables' **uniwind** registry (`packages/registry/src/uniwind/...`),
re-pointed at the project's `@/lib/utils` `cn`. Do **not** run the RNR CLI — it
misdetects this project's custom `dtsFile` path and would wire up NativeWind. Add
new RNR components by copying the uniwind source manually.

- `Text` (`@/components/ui/text`) — use instead of react-native `Text`. Themed by
  default; supports `variant` (h1–h4, p, lead, large, small, muted, code) and
  `asChild`. Inherits color from `TextClassContext` (set by `Button`/`Card`).
- `Button` (`@/components/ui/button`) — real action buttons only. Variants:
  default, destructive, outline, secondary, ghost, link; sizes: default, sm, lg,
  icon. Put a `<Text>` child inside; it picks up the button's text color via
  context automatically.
- `Card` (`@/components/ui/card`) + `CardHeader/Title/Description/Content/Footer`.

Conventions:
- react-native `Text` → ui `Text` everywhere.
- Action buttons → `<Button>`. Leave **tappable surfaces** (cards, tabs,
  segmented toggles, icon-only header taps) as `Pressable` — Button imposes
  button sizing/semantics that break those.

# General Guidelines

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

