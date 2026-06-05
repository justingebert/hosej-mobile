export const NOTIFICATION_LANGUAGES = ["en", "de"] as const;
export type NotificationLanguage = (typeof NOTIFICATION_LANGUAGES)[number];

export const NOTIFICATION_STYLES = ["default", "chaos"] as const;
export type NotificationStyle = (typeof NOTIFICATION_STYLES)[number];

export const DEFAULT_NOTIFICATION_LANGUAGE: NotificationLanguage = "en";
export const DEFAULT_NOTIFICATION_STYLE: NotificationStyle = "default";

export const NOTIFICATION_PREF_KEYS = [
  "questionUnanswered",
  "rallySubmitDeadline",
  "rallyVoteDeadline",
  "rallyFirstSubmission",
  "jukeboxSubmit",
  "jukeboxRate",
] as const;
export type NotificationPrefKey = (typeof NOTIFICATION_PREF_KEYS)[number];
export type NotificationPrefs = Record<NotificationPrefKey, boolean>;

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  questionUnanswered: true,
  rallySubmitDeadline: true,
  rallyVoteDeadline: true,
  rallyFirstSubmission: true,
  jukeboxSubmit: true,
  jukeboxRate: true,
};

export interface UserDTO {
  _id: string;
  username: string;
  groups: string[];

  deviceId?: string;
  fcmToken?: string;
  googleConnected: boolean;
  googleId?: string;
  connectToken?: string;
  connectTokenExpiresAt?: string;

  avatar?: string;
  avatarUrl?: string;
  lastOnline?: string;
  onboardingCompleted?: boolean;
  announcementsSeen?: string[];

  notificationLanguage: NotificationLanguage;
  notificationStyle: NotificationStyle;
  notificationPrefs: NotificationPrefs;

  createdAt: string;
}

/** Fields accepted by PUT /api/users. */
export interface UpdateUserData {
  username?: string;
  avatar?: string | null;
  onboardingCompleted?: boolean;
  announcementsSeen?: string[];
  notificationLanguage?: NotificationLanguage;
  notificationStyle?: NotificationStyle;
  notificationPrefs?: Partial<NotificationPrefs>;
}
