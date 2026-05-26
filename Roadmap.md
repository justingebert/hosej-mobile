Roadmap

#  Phase 0 — Foundation
    Expo + expo-router + Uniwind + rnr + TanStack Query
    fetcher, API base URL, QueryClientProvider
    stub auth header for dev

#  Phase 1 — Shell
    tab nav (groups, settings)
    base UI primitives (Button, Text, Header, Sheet)
    loading / empty / error states

#  Phase 2 — Read loop
    Groups list → group dashboard
    Daily question (fetch + render)
    pull-to-refresh, optimistic cache

#  Phase 3 — Write loop
    Vote on question
    Send chat message
    proves mutations + cache invalidation end-to-end

#  Phase 4 — Features (one at a time, same pattern)
    Rally (defer photo upload)
    Jukebox
    Leaderboard / stats
    Announcements

#  Phase 5 — Platform glue
    Real auth (device + Google)
    S3 presigned uploads
    Push notifications (FCM / expo-notifications)
    Deep links (/r/[code])

#  Phase 6 — Polish & ship
    Theming, haptics, animations
    Sentry + PostHog
    EAS build, TestFlight / Play internal

  Rule: finish a phase end-to-end before next. No half-done features carried forward.
