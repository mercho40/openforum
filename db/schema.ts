import { pgTable, varchar, timestamp, text, integer, uniqueIndex, foreignKey, boolean, type AnyPgColumn, index, primaryKey, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const entityType = pgEnum("EntityType", ['THREAD', 'POST', 'USER', 'TAG', 'BADGE', 'CATEGORY', 'SYSTEM'])
export const notificationType = pgEnum("NotificationType", ['MENTION', 'REPLY', 'LIKE', 'SOLUTION', 'THREAD', 'MODERATION', 'BADGE', 'SYSTEM'])
export const reactionType = pgEnum("ReactionType", ['LIKE', 'DISLIKE', 'LAUGH', 'HEART', 'CELEBRATE', 'THINKING'])
export const reportStatus = pgEnum("ReportStatus", ['PENDING', 'REJECTED', 'RESOLVED', 'IN_PROGRESS'])
export const reportType = pgEnum("ReportType", ['SPAM', 'HARASSMENT', 'INAPPROPRIATE', 'OFF_TOPIC', 'ILLEGAL', 'OTHER'])
export const userRole = pgEnum("UserRole", ['user', 'moderator', 'admin'])


export const prismaMigrations = pgTable("_prisma_migrations", {
  id: varchar({ length: 36 }).primaryKey().notNull(),
  checksum: varchar({ length: 64 }).notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true, mode: 'string' }),
  migrationName: varchar("migration_name", { length: 255 }).notNull(),
  logs: text(),
  rolledBackAt: timestamp("rolled_back_at", { withTimezone: true, mode: 'string' }),
  startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  appliedStepsCount: integer("applied_steps_count").default(0).notNull(),
});

export const category = pgTable("category", {
  id: text().primaryKey().notNull(),
  name: text().notNull(),
  description: text(),
  slug: text().notNull(),
  isActive: boolean().default(true).notNull(),
  sortOrder: integer().default(0).notNull(),
  parentId: text(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
  uniqueIndex("category_slug_key").using("btree", table.slug.asc().nullsLast().op("text_ops")),
  foreignKey({
    columns: [table.parentId],
    foreignColumns: [table.id],
    name: "category_parentId_fkey"
  }).onUpdate("cascade").onDelete("set null"),
]);

export const user = pgTable("user", {
  id: text().primaryKey().notNull(),
  name: text().notNull(),
  email: text().notNull(),
  emailVerified: boolean().notNull(),
  image: text(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  twoFactorEnabled: boolean(),
  banned: boolean().default(false).notNull(),
  banReason: text(),
  banExpires: timestamp({ precision: 3, mode: 'string' }),
  bio: text(),
  location: text(),
  reputation: integer().default(0).notNull(),
  signature: text(),
  website: text(),
  role: userRole().default('user').notNull(),
  displayUsername: text(),
  username: text(),
  metadata: text(),
  profileUpdatedAt: timestamp({ precision: 3, mode: 'string' }),
}, (table) => [
  uniqueIndex("user_email_key").using("btree", table.email.asc().nullsLast().op("text_ops")),
  uniqueIndex("user_username_key").using("btree", table.username.asc().nullsLast().op("text_ops")),
]);

export const categoryModerator = pgTable("category_moderator", {
  id: text().primaryKey().notNull(),
  categoryId: text().notNull(),
  userId: text().notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  uniqueIndex("category_moderator_categoryId_userId_key").using("btree", table.categoryId.asc().nullsLast().op("text_ops"), table.userId.asc().nullsLast().op("text_ops")),
  foreignKey({
    columns: [table.categoryId],
    foreignColumns: [category.id],
    name: "category_moderator_categoryId_fkey"
  }).onUpdate("cascade").onDelete("cascade"),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [user.id],
    name: "category_moderator_userId_fkey"
  }).onUpdate("cascade").onDelete("cascade"),
]);

// Define thread without the solutionPostId reference first
export const thread = pgTable("thread", {
  id: text().primaryKey().notNull(),
  title: text().notNull(),
  slug: text().notNull(),
  content: text().notNull(),
  isPinned: boolean().default(false).notNull(),
  isLocked: boolean().default(false).notNull(),
  isSolved: boolean().default(false).notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  categoryId: text().notNull(),
  authorId: text().notNull(),
  solutionPostId: text(),
}, (table) => [
  index("thread_authorId_idx").using("btree", table.authorId.asc().nullsLast().op("text_ops")),
  index("thread_categoryId_idx").using("btree", table.categoryId.asc().nullsLast().op("text_ops")),
  uniqueIndex("thread_slug_categoryId_key").using("btree", table.slug.asc().nullsLast().op("text_ops"), table.categoryId.asc().nullsLast().op("text_ops")),
  foreignKey({
    columns: [table.categoryId],
    foreignColumns: [category.id],
    name: "thread_categoryId_fkey"
  }).onUpdate("cascade").onDelete("cascade"),
  foreignKey({
    columns: [table.authorId],
    foreignColumns: [user.id],
    name: "thread_authorId_fkey"
  }).onUpdate("cascade").onDelete("cascade"),
  // We'll add the solutionPostId foreign key constraint later
]);

export const post = pgTable("post", {
  id: text().primaryKey().notNull(),
  content: text().notNull(),
  isEdited: boolean().default(false).notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  threadId: text().notNull(),
  authorId: text().notNull(),
  parentId: text(),
}, (table) => [
  index("post_authorId_idx").using("btree", table.authorId.asc().nullsLast().op("text_ops")),
  index("post_threadId_idx").using("btree", table.threadId.asc().nullsLast().op("text_ops")),
  foreignKey({
    columns: [table.threadId],
    foreignColumns: [thread.id],
    name: "post_threadId_fkey"
  }).onUpdate("cascade").onDelete("cascade"),
  foreignKey({
    columns: [table.authorId],
    foreignColumns: [user.id],
    name: "post_authorId_fkey"
  }).onUpdate("cascade").onDelete("cascade"),
  foreignKey({
    columns: [table.parentId],
    foreignColumns: [table.id],
    name: "post_parentId_fkey"
  }).onUpdate("cascade").onDelete("set null"),
]);

// Add the solution post foreign key constraint after post is defined
// This is done separately to avoid the circular dependency
sql`ALTER TABLE thread ADD CONSTRAINT thread_solutionPostId_fkey FOREIGN KEY (solution_post_id) REFERENCES post(id) ON UPDATE CASCADE ON DELETE SET NULL`;

export const tag = pgTable("tag", {
  id: text().primaryKey().notNull(),
  name: text().notNull(),
  slug: text().notNull(),
  description: text(),
  color: text(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
  uniqueIndex("tag_name_key").using("btree", table.name.asc().nullsLast().op("text_ops")),
  uniqueIndex("tag_slug_key").using("btree", table.slug.asc().nullsLast().op("text_ops")),
]);

export const verification = pgTable("verification", {
  id: text().primaryKey().notNull(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }),
  updatedAt: timestamp({ precision: 3, mode: 'string' }),
});

export const session = pgTable("session", {
  id: text().primaryKey().notNull(),
  expiresAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  token: text().notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  ipAddress: text(),
  userAgent: text(),
  userId: text().notNull(),
  impersonatedBy: text(),
  activeOrganizationId: text(),
}, (table) => [
  uniqueIndex("session_token_key").using("btree", table.token.asc().nullsLast().op("text_ops")),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [user.id],
    name: "session_userId_fkey"
  }).onUpdate("cascade").onDelete("cascade"),
]);

export const account = pgTable("account", {
  id: text().primaryKey().notNull(),
  accountId: text().notNull(),
  providerId: text().notNull(),
  userId: text().notNull(),
  accessToken: text(),
  refreshToken: text(),
  idToken: text(),
  accessTokenExpiresAt: timestamp({ precision: 3, mode: 'string' }),
  refreshTokenExpiresAt: timestamp({ precision: 3, mode: 'string' }),
  scope: text(),
  password: text(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
  foreignKey({
    columns: [table.userId],
    foreignColumns: [user.id],
    name: "account_userId_fkey"
  }).onUpdate("cascade").onDelete("cascade"),
]);

export const twoFactor = pgTable("twoFactor", {
  id: text().primaryKey().notNull(),
  secret: text().notNull(),
  backupCodes: text().notNull(),
  userId: text().notNull(),
}, (table) => [
  foreignKey({
    columns: [table.userId],
    foreignColumns: [user.id],
    name: "twoFactor_userId_fkey"
  }).onUpdate("cascade").onDelete("cascade"),
]);

export const organization = pgTable("organization", {
  id: text().primaryKey().notNull(),
  name: text().notNull(),
  slug: text(),
  logo: text(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  metadata: text(),
}, (table) => [
  uniqueIndex("organization_slug_key").using("btree", table.slug.asc().nullsLast().op("text_ops")),
]);

export const member = pgTable("member", {
  id: text().primaryKey().notNull(),
  organizationId: text().notNull(),
  userId: text().notNull(),
  role: text().notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
  foreignKey({
    columns: [table.organizationId],
    foreignColumns: [organization.id],
    name: "member_organizationId_fkey"
  }).onUpdate("cascade").onDelete("cascade"),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [user.id],
    name: "member_userId_fkey"
  }).onUpdate("cascade").onDelete("cascade"),
]);

export const invitation = pgTable("invitation", {
  id: text().primaryKey().notNull(),
  organizationId: text().notNull(),
  email: text().notNull(),
  role: text(),
  status: text().notNull(),
  expiresAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
  inviterId: text().notNull(),
}, (table) => [
  foreignKey({
    columns: [table.organizationId],
    foreignColumns: [organization.id],
    name: "invitation_organizationId_fkey"
  }).onUpdate("cascade").onDelete("cascade"),
  foreignKey({
    columns: [table.inviterId],
    foreignColumns: [user.id],
    name: "invitation_inviterId_fkey"
  }).onUpdate("cascade").onDelete("cascade"),
]);

export const threadView = pgTable("thread_view", {
  id: text().primaryKey().notNull(),
  threadId: text().notNull(),
  userId: text().notNull(),
  ipAddress: text(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  index("thread_view_threadId_idx").using("btree", table.threadId.asc().nullsLast().op("text_ops")),
  uniqueIndex("thread_view_threadId_userId_key").using("btree", table.threadId.asc().nullsLast().op("text_ops"), table.userId.asc().nullsLast().op("text_ops")),
  foreignKey({
    columns: [table.threadId],
    foreignColumns: [thread.id],
    name: "thread_view_threadId_fkey"
  }).onUpdate("cascade").onDelete("cascade"),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [user.id],
    name: "thread_view_userId_fkey"
  }).onUpdate("cascade").onDelete("cascade"),
]);

export const reaction = pgTable("reaction", {
  id: text().primaryKey().notNull(),
  type: reactionType().notNull(),
  threadId: text(),
  postId: text(),
  userId: text().notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  uniqueIndex("reaction_userId_threadId_postId_type_key").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.threadId.asc().nullsLast().op("text_ops"), table.postId.asc().nullsLast().op("text_ops"), table.type.asc().nullsLast().op("text_ops")),
  foreignKey({
    columns: [table.threadId],
    foreignColumns: [thread.id],
    name: "reaction_threadId_fkey"
  }).onUpdate("cascade").onDelete("cascade"),
  foreignKey({
    columns: [table.postId],
    foreignColumns: [post.id],
    name: "reaction_postId_fkey"
  }).onUpdate("cascade").onDelete("cascade"),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [user.id],
    name: "reaction_userId_fkey"
  }).onUpdate("cascade").onDelete("cascade"),
]);

export const bookmark = pgTable("bookmark", {
  id: text().primaryKey().notNull(),
  threadId: text().notNull(),
  userId: text().notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  uniqueIndex("bookmark_threadId_userId_key").using("btree", table.threadId.asc().nullsLast().op("text_ops"), table.userId.asc().nullsLast().op("text_ops")),
  foreignKey({
    columns: [table.threadId],
    foreignColumns: [thread.id],
    name: "bookmark_threadId_fkey"
  }).onUpdate("cascade").onDelete("cascade"),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [user.id],
    name: "bookmark_userId_fkey"
  }).onUpdate("cascade").onDelete("cascade"),
]);

export const notification = pgTable("notification", {
  id: text().primaryKey().notNull(),
  type: notificationType().notNull(),
  userId: text().notNull(),
  actorId: text(),
  entityId: text().notNull(),
  entityType: entityType().notNull(),
  isRead: boolean().default(false).notNull(),
  title: text(),
  message: text(),
  link: text(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  index("notification_userId_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [user.id],
    name: "notification_userId_fkey"
  }).onUpdate("cascade").onDelete("cascade"),
]);

export const badge = pgTable("badge", {
  id: text().primaryKey().notNull(),
  name: text().notNull(),
  description: text(),
  image: text(),
  criteria: text(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
  uniqueIndex("badge_name_key").using("btree", table.name.asc().nullsLast().op("text_ops")),
]);

export const userBadge = pgTable("user_badge", {
  id: text().primaryKey().notNull(),
  userId: text().notNull(),
  badgeId: text().notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  uniqueIndex("user_badge_userId_badgeId_key").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.badgeId.asc().nullsLast().op("text_ops")),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [user.id],
    name: "user_badge_userId_fkey"
  }).onUpdate("cascade").onDelete("cascade"),
  foreignKey({
    columns: [table.badgeId],
    foreignColumns: [badge.id],
    name: "user_badge_badgeId_fkey"
  }).onUpdate("cascade").onDelete("cascade"),
]);

export const report = pgTable("report", {
  id: text().primaryKey().notNull(),
  type: reportType().notNull(),
  reason: text().notNull(),
  details: text(),
  status: reportStatus().default('PENDING').notNull(),
  threadId: text(),
  postId: text(),
  reporterId: text().notNull(),
  reportedId: text(),
  resolution: text(),
  closedById: text(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
}, (table) => [
  foreignKey({
    columns: [table.threadId],
    foreignColumns: [thread.id],
    name: "report_threadId_fkey"
  }).onUpdate("cascade").onDelete("set null"),
  foreignKey({
    columns: [table.postId],
    foreignColumns: [post.id],
    name: "report_postId_fkey"
  }).onUpdate("cascade").onDelete("set null"),
  foreignKey({
    columns: [table.reporterId],
    foreignColumns: [user.id],
    name: "report_reporterId_fkey"
  }).onUpdate("cascade").onDelete("cascade"),
  foreignKey({
    columns: [table.reportedId],
    foreignColumns: [user.id],
    name: "report_reportedId_fkey"
  }).onUpdate("cascade").onDelete("set null"),
]);

export const threadTag = pgTable("thread_tag", {
  threadId: text().notNull(),
  tagId: text().notNull(),
  createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  foreignKey({
    columns: [table.threadId],
    foreignColumns: [thread.id],
    name: "thread_tag_threadId_fkey"
  }).onUpdate("cascade").onDelete("cascade"),
  foreignKey({
    columns: [table.tagId],
    foreignColumns: [tag.id],
    name: "thread_tag_tagId_fkey"
  }).onUpdate("cascade").onDelete("cascade"),
  primaryKey({ columns: [table.threadId, table.tagId], name: "thread_tag_pkey" }),
]);
