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

// POST /api/groups/:groupId/members
export interface JoinGroupResponseDTO {
  message: string;
  group: GroupDTO;
}
