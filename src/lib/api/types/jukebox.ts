// Mirrors the web repo's jukebox routes under
// /api/groups/:groupId/jukebox. Hand-maintained on purpose: the backend's
// `ToDTO<IJukebox>` is derived from the mongoose model, so these narrower,
// serialization-correct shapes are the actual API contract.

/** Submitter / rater as populated by the jukebox service (`_id username avatar`). */
export interface JukeboxUserDTO {
  _id: string;
  username: string;
  avatarUrl?: string;
}

export interface SongRatingDTO {
  userId: JukeboxUserDTO;
  rating: number;
}

// Songs come back pre-sorted (yours-to-rate first, then by avgRating desc) with
// `ratings` sorted high→low. `userHasRated` is also true for your OWN song —
// the server folds "can't rate this" into one flag.
export interface JukeboxSongDTO {
  _id: string;
  spotifyTrackId: string;
  title: string;
  artist: string;
  album: string;
  coverImageUrl: string;
  submittedBy: JukeboxUserDTO;
  ratings: SongRatingDTO[];
  avgRating: number | null;
  userHasRated: boolean;
}

// GET /api/groups/:groupId/jukebox?isActive=true — returns an array. A group can
// run several concurrent jukeboxes (`features.jukebox.settings.concurrent`),
// though the default is one.
export interface JukeboxDTO {
  _id: string;
  groupId: string;
  title?: string;
  active: boolean;
  chat?: string;
  createdAt: string;
  userHasSubmitted: boolean;
  songs: JukeboxSongDTO[];
}

// POST /api/groups/:groupId/jukebox/:jukeboxId/song
// One song per user per jukebox — a second attempt is a 409.
export interface AddSongInput {
  spotifyTrackId: string;
  title: string;
  artist: string;
  album?: string;
  coverImageUrl?: string;
}

// GET /api/groups/:groupId/jukebox/search?q= proxies Spotify's search response
// verbatim. Typed to only the fields the submit flow reads.
export interface SpotifyTrackDTO {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
}

export interface TrackSearchResponseDTO {
  tracks?: { items: SpotifyTrackDTO[] };
}

export const MIN_SONG_RATING = 1;
export const MAX_SONG_RATING = 100;
