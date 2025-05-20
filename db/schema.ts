import { pgTable, text, timestamp, boolean, integer, index, primaryKey, jsonb } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  twoFactorEnabled: boolean('two_factor_enabled'),
  role: text('role'),
  banned: boolean('banned'),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),
  username: text('username').unique(),
  displayUsername: text('display_username'),
  metadata: text('metadata'),
  bio: text('bio'),
  signature: text('signature'),
  website: text('website'),
  location: text('location'),
  profileUpdatedAt: timestamp('profile_updated_at', { precision: 3, mode: 'string' }),
  reputation: integer('reputation').default(0).notNull(),
}, (table) => ({
  emailIdx: index('user_email_idx').on(table.email),
}));
export const session = pgTable("session", {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  impersonatedBy: text('impersonated_by')
}, (table) => {
  return {
    userIdIdx: index('session_user_id_idx').on(table.userId),
    tokenIdx: index('session_token_idx').on(table.token),
  }
});

export const account = pgTable("account", {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
}, (table) => {
  return {
    userIdIdx: index('account_user_id_idx').on(table.userId),
  }
});

export const verification = pgTable("verification", {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date())
}, (table) => {
  return {
    identifierIdx: index('verification_identifier_idx').on(table.identifier),
  }
});

export const twoFactor = pgTable("two_factor", {
  id: text('id').primaryKey(),
  secret: text('secret').notNull(),
  backupCodes: text('backup_codes').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' })
}, (table) => {
  return {
    secretIdx: index('two_factor_secret_idx').on(table.secret),
  }
});

export const category = pgTable("category", {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description'),
  slug: text('slug').notNull().unique(),
  displayOrder: integer('display_order').default(0).notNull(),
  isHidden: boolean('is_hidden').default(false).notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
  metadata: jsonb('metadata'),
  iconClass: text('icon_class'),
  color: text('color').default('#3498db'),
}, (table) => {
  return {
    slugIdx: index('category_slug_idx').on(table.slug),
  }
});

export const post = pgTable("post", {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  content: text('content').notNull(),
  threadId: text('thread_id').notNull(),
  authorId: text('author_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  isEdited: boolean('is_edited').default(false).notNull(),
  editedAt: timestamp('edited_at'),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  isHidden: boolean('is_hidden').default(false).notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
  metadata: jsonb('metadata'),
}, (table) => {
  return {
    threadIdIdx: index('post_thread_id_idx').on(table.threadId),
    authorIdIdx: index('post_author_id_idx').on(table.authorId),
    createdAtIdx: index('post_created_at_idx').on(table.createdAt),
  }
});

export const thread = pgTable("thread", {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  categoryId: text('category_id').notNull().references(() => category.id, { onDelete: 'cascade' }),
  authorId: text('author_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  isPinned: boolean('is_pinned').default(false).notNull(),
  isLocked: boolean('is_locked').default(false).notNull(),
  isHidden: boolean('is_hidden').default(false).notNull(),
  viewCount: integer('view_count').default(0).notNull(),
  lastPostId: text('last_post_id').references(() => post.id, { onDelete: 'set null' }),
  lastPostAt: timestamp('last_post_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  metadata: jsonb('metadata'),
  replyCount: integer('reply_count').default(0).notNull(),
}, (table) => ({
  categoryIdIdx: index('thread_category_id_idx').on(table.categoryId),
  authorIdIdx: index('thread_author_id_idx').on(table.authorId),
  lastPostAtIdx: index('thread_last_post_at_idx').on(table.lastPostAt),
  slugIdx: index('thread_slug_idx').on(table.slug),
}));

export const vote = pgTable("vote", {
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  postId: text('post_id').notNull().references(() => post.id, { onDelete: 'cascade' }),
  value: integer('value').notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.postId] }),
    userIdIdx: index('vote_user_id_idx').on(table.userId),
    postIdIdx: index('vote_post_id_idx').on(table.postId),
  }
});

export const tag = pgTable("tag", {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  color: text('color').default('#3498db').notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
}, (table) => {
  return {
    slugIdx: index('tag_slug_idx').on(table.slug),
  }
});

export const threadTag = pgTable("thread_tag", {
  threadId: text('thread_id').notNull().references(() => thread.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tag.id, { onDelete: 'cascade' }),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.threadId, table.tagId] }),
    threadIdIdx: index('thread_tag_thread_id_idx').on(table.threadId),
    tagIdIdx: index('thread_tag_tag_id_idx').on(table.tagId),
  }
});

export const notification = pgTable("notification", {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  read: boolean('read').default(false).notNull(),
  data: jsonb('data').notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
}, (table) => {
  return {
    userIdIdx: index('notification_user_id_idx').on(table.userId),
    userIdReadIdx: index('notification_user_id_read_idx').on(table.userId, table.read),
  }
});

export const threadSubscription = pgTable("thread_subscription", {
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  threadId: text('thread_id').notNull().references(() => thread.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.threadId] }),
    userIdIdx: index('thread_subscription_user_id_idx').on(table.userId),
  }
});

export const categorySubscription = pgTable("category_subscription", {
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  categoryId: text('category_id').notNull().references(() => category.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.categoryId] }),
    userIdIdx: index('category_subscription_user_id_idx').on(table.userId),
  }
});
