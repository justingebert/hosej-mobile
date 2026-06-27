export const GROUP_LANGUAGES = ["de", "en"] as const;
export type GroupLanguage = (typeof GROUP_LANGUAGES)[number];

export interface FeatureSeenAtDTO {
  question: string | null;
  rally: string | null;
  jukebox: string | null;
}

export interface GroupMemberDTO {
  user: string;
  name: string;
  points: number;
  streak: number;
  lastPointDate: string | null;
  joinedAt: string;
  lastSeenAt: FeatureSeenAtDTO;
  avatarUrl?: string;
  lastOnline?: string;
}

export interface GroupQuestionsFeatureDTO {
  enabled: boolean;
  settings: {
    questionCount: number;
    lastQuestionDate: string | null;
    packs: string[];
  };
}

export interface GroupRalliesFeatureDTO {
  enabled: boolean;
  settings: {
    rallyCount: number;
    rallyGapDays: number;
  };
}

export interface GroupJukeboxFeatureDTO {
  enabled: boolean;
  settings: {
    concurrent: string[];
    activationDays: number[];
  };
}

export interface GroupFeaturesDTO {
  questions: GroupQuestionsFeatureDTO;
  rallies: GroupRalliesFeatureDTO;
  jukebox: GroupJukeboxFeatureDTO;
}

export interface GroupDTO {
  _id: string;
  name: string;
  admin: string;
  language: GroupLanguage;
  members: GroupMemberDTO[];
  features: GroupFeaturesDTO;
  createdAt: string;
}

export interface GroupWithAdminDTO extends GroupDTO {
  userIsAdmin: boolean;
}

export interface GroupListResponseDTO {
  groups: GroupDTO[];
}

export interface CreateGroupInput {
  name: string;
  language?: GroupLanguage;
}

// POST /api/invites/:code — join by invite code (idempotent).
export interface JoinByCodeResponseDTO {
  group: GroupDTO;
}

// GET /api/invites/:code — public preview; never leaks the groupId.
export interface InvitePreviewDTO {
  name: string;
  memberCount: number;
}

// GET /api/groups/:groupId/invite and POST .../invite/reset.
export interface GroupInviteDTO {
  code: string;
}

// Body for PUT /api/groups/:groupId. The server shallow-merges `features` by
// key, so any feature you send must be the complete object for that key.
export interface UpdateGroupInput {
  name?: string;
  features?: Partial<GroupFeaturesDTO>;
}

export interface QuestionPackStatDTO {
  packId: string;
  name: string;
  total: number;
  used: number;
  left: number;
}

// GET /api/groups/:groupId/stats — only the fields the mobile stats screen
// renders (questions feature + overview row). Rally/jukebox fields the endpoint
// also returns are omitted until those features migrate.
export interface GroupStatsDTO {
  questionsUsedCount: number;
  questionsLeftCount: number;
  questionsByType: { _id: string; count: number }[];
  questionsByUser: { username: string; count: number }[];
  selfCreatedUsedCount: number;
  selfCreatedLeftCount: number;
  packQuestionsUsedCount: number;
  packQuestionsLeftCount: number;
  packs: QuestionPackStatDTO[];
  messagesCount: number;
}
