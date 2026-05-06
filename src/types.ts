// Teddy Mail - core domain types
// All IDs are opaque strings to allow swap to UUID/server IDs without refactor.

export type AccountId = string;
export type MailId = string;
export type ThreadId = string;
export type FolderId = string;
export type LabelId = string;

export type Category =
  | 'personal'
  | 'work'
  | 'notifications'
  | 'newsletters'
  | 'promotions'
  | 'unsorted';

export type Priority = 'normal' | 'high' | 'urgent';

export interface Account {
  id: AccountId;
  email: string;
  displayName: string;
  protocol: 'imap' | 'jmap';
  color: string; // hex, used as accent for the account
  signature: string;
  /** Base64 data URL of the user's profile photo, optional. */
  photoUrl?: string | undefined;
}

export interface Address {
  name?: string;
  email: string;
}

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  // In real backend this is a content hash for deduplication.
  contentHash: string;
}

export interface Mail {
  id: MailId;
  threadId: ThreadId;
  accountId: AccountId;
  folder: FolderId;
  labels: LabelId[];

  from: Address;
  to: Address[];
  cc: Address[];
  bcc: Address[];
  replyTo?: Address;

  subject: string;
  bodyText: string;
  bodyHtml?: string;

  attachments: Attachment[];

  // Metadata
  receivedAt: string; // ISO
  read: boolean;
  starred: boolean;
  category: Category;
  priority: Priority;

  // Tracker detection result, populated at parse time.
  trackersBlocked: number;

  // Snooze, undefined if not snoozed.
  snoozedUntil?: string;

  // Inferred engagement, e.g. "I will send you the doc Friday".
  engagements?: Engagement[];

  // Thread metadata cached on the mail itself.
  inReplyTo?: string; // Message-ID
  references: string[];
}

export interface Engagement {
  text: string; // surface form
  due?: string; // ISO if a date was inferred
  reminded: boolean;
}

export interface Thread {
  id: ThreadId;
  accountId: AccountId;
  subject: string;
  participants: Address[];
  mailIds: MailId[];
  lastReceivedAt: string;
  hasUnread: boolean;
  category: Category;
}

export interface Folder {
  id: FolderId;
  accountId: AccountId;
  name: string;
  type: 'inbox' | 'sent' | 'drafts' | 'archive' | 'trash' | 'snoozed' | 'custom';
  unreadCount: number;
}

export interface Label {
  id: LabelId;
  name: string;
  color: string;
}

export type ThemeName = 'light' | 'dark' | 'sepia' | 'solarized' | 'contrast' | 'nocturne';
export type Density = 'compact' | 'cozy' | 'spacious';

export interface UserPreferences {
  theme: ThemeName;
  density: Density;
  fontSize: number; // px, 12-18
  unifiedInbox: boolean;
  blockTrackers: boolean;
  blockRemoteImages: 'always' | 'trusted' | 'never';
  undoSendSeconds: 0 | 5 | 10 | 30;
  swipeLeft: SwipeAction;
  swipeRight: SwipeAction;
  notificationsEnabled: boolean;
  quietHours?: { start: string; end: string }; // "HH:MM"
  keyboardProfile: 'teddy' | 'gmail' | 'outlook' | 'mutt';
  reducedMotion: 'auto' | 'always' | 'never';
  soundPack: 'off' | 'subtle' | 'crisp';
}

export type SwipeAction = 'archive' | 'delete' | 'snooze' | 'star' | 'markRead';

export interface SavedView {
  id: string;
  name: string;
  query: string; // search query DSL
}

export interface Draft {
  id: string;
  accountId: AccountId;
  to: Address[];
  cc: Address[];
  bcc: Address[];
  subject: string;
  body: string;
  inReplyTo?: MailId;
  updatedAt: string;
}

export interface PendingSend {
  draftId: string;
  scheduledAt: string; // ISO
  cancellable: boolean;
}
