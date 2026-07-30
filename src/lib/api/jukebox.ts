import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./client";
import { haptics } from "@/lib/haptics";
import type {
  AddSongInput,
  JukeboxDTO,
  SpotifyTrackDTO,
  TrackSearchResponseDTO,
} from "./types/jukebox";

export const jukeboxKeys = {
  all: ["jukeboxes"] as const,
  active: (groupId: string) => ["groups", groupId, "jukeboxes", "active"] as const,
  search: (groupId: string, query: string) =>
    ["groups", groupId, "jukeboxes", "search", query] as const,
};

export function useActiveJukeboxes(groupId: string) {
  return useQuery({
    queryKey: jukeboxKeys.active(groupId),
    queryFn: () => apiFetch<JukeboxDTO[]>(`/api/groups/${groupId}/jukebox?isActive=true`),
    enabled: !!groupId,
  });
}

// Spotify track search, proxied by the API. Deliberately NOT debounced — the
// query only runs once the user submits a search term, so each keystroke isn't a
// Spotify call. Pass "" to keep it idle.
export function useTrackSearch(groupId: string, query: string) {
  return useQuery({
    queryKey: jukeboxKeys.search(groupId, query),
    queryFn: async () => {
      const data = await apiFetch<TrackSearchResponseDTO>(
        `/api/groups/${groupId}/jukebox/search?q=${encodeURIComponent(query)}`
      );
      return data.tracks?.items ?? [];
    },
    enabled: !!groupId && query.length > 0,
    // Search results don't go stale in a session, and re-running costs a
    // Spotify call — so keep them for the whole visit.
    staleTime: Infinity,
  });
}

export function useAddSong(groupId: string, jukeboxId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddSongInput) =>
      apiFetch(`/api/groups/${groupId}/jukebox/${jukeboxId}/song`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    meta: {
      errorToastTitle: "Could not add song",
    },
    // Fire-and-forget the invalidation instead of awaiting it: a successful
    // submit flips `userHasSubmitted`, which swaps the search UI out for the song
    // list. Awaiting here would unmount the confirm sheet before its dismiss()
    // could run, so it would vanish instead of animating away.
    onSuccess: () => {
      haptics.success();
      void queryClient.invalidateQueries({ queryKey: jukeboxKeys.active(groupId) });
    },
  });
}

// Rating is write-once: the server rejects a second rating (and your own song)
// with a 409, so there's no optimistic update here — a failed rate must not
// leave a phantom score on screen.
export function useRateSong(groupId: string, jukeboxId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ songId, rating }: { songId: string; rating: number }) =>
      apiFetch(`/api/groups/${groupId}/jukebox/${jukeboxId}/song/${songId}/rate`, {
        method: "POST",
        body: JSON.stringify({ rating }),
      }),
    meta: {
      errorToastTitle: "Could not submit rating",
    },
    onSuccess: async () => {
      haptics.success();
      await queryClient.invalidateQueries({ queryKey: jukeboxKeys.active(groupId) });
    },
  });
}

/** Flattens a Spotify search hit into the shape the add-song endpoint wants. */
export function toAddSongInput(track: SpotifyTrackDTO): AddSongInput {
  return {
    spotifyTrackId: track.id,
    title: track.name,
    artist: track.artists.map((artist) => artist.name).join(", "),
    album: track.album.name,
    coverImageUrl: track.album.images[0]?.url ?? "",
  };
}
