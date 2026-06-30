# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v55.0.0/ before writing any code.

The exisitng Webapplication Hosej lives: /Users/justingebert/Projects/Personal/HoseJ/hosej

when using Icons use lucide-react-native icons

# Data Fetching & Screen States

Server state flows through React Query hooks in `src/lib/api/*` (one query-key
factory per resource). Loading/error/empty render with **explicit, in-place
branches** — no render-prop wrappers, no hidden control flow. The repeated views
are shared primitives in `src/components/ui/`; reuse them instead of hand-rolling
per screen:

- `Screen` — scrollable container with themed background + optional
  pull-to-refresh. Pass `onRefresh={refetch}` and `refreshing={isRefetching}`.
- `ErrorCard` — the single error view for a failed query. Renders where the
  content would be, with an optional retry button. Props: `title`, `error`,
  `onRetry`, `isRetrying`.
- `EmptyState` — "no content yet" (distinct from an error). Props: `title`,
  optional `description`.
- `Skeleton` — placeholder-bar primitive. Compose into a content-shaped
  skeleton kept **local** to each screen.

There are **two tiers**. Use Tier 1 for whole route screens; Tier 2 for a data
region embedded inside otherwise-valid content (e.g. the chat list under the
vote results).

## Tier 1 — route screens

Explicit 4-branch chain, in this order. `Screen` wraps it (except lists — see
below):

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

- Branch **order is load-bearing** (pending → error → empty → content).
- `isPending` must be paired with a guaranteed-`enabled` query. A query disabled
  via `enabled: false` (e.g. an empty `groupId`) sits in `isPending` forever, so
  the skeleton never clears — gate the branch, don't enable a half-built query.
- **Multiple required queries on one screen** (e.g. results = `useQuestionResults`
  + `useQuestion`): combine the booleans —
  `isPending = a.isPending || b.isPending`, `isError = a.isError || b.isError`,
  and the retry refetches both. Non-essential sub-regions stay Tier 2.
- **Empty states**: a bare title/description uses the shared `EmptyState`. An
  empty that needs **actions** (buttons/links — e.g. the question screen's
  Activate / Go-to-Create guide) is a **local component** (like a skeleton), not
  a bloated `EmptyState`.

## Tier 2 — embedded regions

A region inside a screen whose surrounding content is still valid. **Convention,
not a component** — there's one today (the chat list), so don't abstract it;
extract a primitive the day a second region needs it.

- Flows inline — **no `flex-1` centering**.
- Loading → a small **local skeleton** (no spinner — skeletons everywhere).
- Error → a subtle **`Button`** (`variant="link"`, `size="sm"`) that calls
  `refetch` ("Couldn't load … · Try again"). A retry is an action, so it's a real
  `Button`, not a bare `Pressable` (see UI Components) — but never `ErrorCard`
  (too heavy, steals focus from the valid content above it). Never a silent
  dead-end.
- Empty → one-line muted `Text`.

## Paginated lists (`FlatList`)

A long feed (history) uses `FlatList`, **not** `Screen` — a `ScrollView` would
render every row. `group-history-screen.tsx` is the canonical reference. Route
the same 4 states through the list and its slots:

- pending → local list skeleton · error → `ErrorCard` · empty → `EmptyState`
  (distinguish filtered "no matches" from truly "none yet").
- `RefreshControl` goes on the `FlatList` directly.
- Next page: `ListFooterComponent` = skeleton row while `isFetchingNextPage`.
- **Accepted as-is:** load-more failure is silent (re-tries on next scroll);
  changing filters flashes the full skeleton **on purpose** (visible loading is
  wanted there) — do not add `keepPreviousData`.

## Errors: cards, toasts, and silence

- **Query first-load error → `ErrorCard`** (Tier 1) / inline retry (Tier 2). This
  is the only time the user has nothing to look at.
- **Mutation/action error → toast**, not a card — the screen content is still
  valid. Wired globally: `MutationCache.onError` in `src/lib/query.ts` reads
  `meta.errorToastTitle` (opt out with `meta.suppressErrorToast`).
- **Background refetch failure → silent, by design.** Once a query has data,
  React Query keeps `status: 'success'` (so `isError` stays false) and holds the
  stale data on a failed refetch — the list is never clobbered and a failed
  pull-to-refresh shows nothing. There is no `QueryCache.onError`; don't add one.

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
- Action buttons → `<Button>`. This includes **text/inline actions** like a
  "Try again" retry — use `variant="link"` (and `size="sm"`) rather than a bare
  `Pressable` around a `Text`, so they stay accessible and consistent. Leave
  **tappable surfaces** (cards, tabs, segmented toggles, icon-only header taps,
  bespoke-styled controls like the chat send button) as `Pressable` — Button
  imposes button sizing/semantics that break those.

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

