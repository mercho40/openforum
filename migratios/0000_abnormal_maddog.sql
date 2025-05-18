-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."EntityType" AS ENUM('THREAD', 'POST', 'USER', 'TAG', 'BADGE', 'CATEGORY', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."NotificationType" AS ENUM('MENTION', 'REPLY', 'LIKE', 'SOLUTION', 'THREAD', 'MODERATION', 'BADGE', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."ReactionType" AS ENUM('LIKE', 'DISLIKE', 'LAUGH', 'HEART', 'CELEBRATE', 'THINKING');--> statement-breakpoint
CREATE TYPE "public"."ReportStatus" AS ENUM('PENDING', 'REJECTED', 'RESOLVED', 'IN_PROGRESS');--> statement-breakpoint
CREATE TYPE "public"."ReportType" AS ENUM('SPAM', 'HARASSMENT', 'INAPPROPRIATE', 'OFF_TOPIC', 'ILLEGAL', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."UserRole" AS ENUM('user', 'moderator', 'admin');--> statement-breakpoint
CREATE TABLE "_prisma_migrations" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"finished_at" timestamp with time zone,
	"migration_name" varchar(255) NOT NULL,
	"logs" text,
	"rolled_back_at" timestamp with time zone,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"applied_steps_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"slug" text NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"parentId" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "category_moderator" (
	"id" text PRIMARY KEY NOT NULL,
	"categoryId" text NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "thread" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" text NOT NULL,
	"isPinned" boolean DEFAULT false NOT NULL,
	"isLocked" boolean DEFAULT false NOT NULL,
	"isSolved" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"categoryId" text NOT NULL,
	"authorId" text NOT NULL,
	"solutionPostId" text
);
--> statement-breakpoint
CREATE TABLE "post" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"isEdited" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"threadId" text NOT NULL,
	"authorId" text NOT NULL,
	"parentId" text
);
--> statement-breakpoint
CREATE TABLE "tag" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"color" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp(3) NOT NULL,
	"createdAt" timestamp(3),
	"updatedAt" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp(3) NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp(3) NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	"impersonatedBy" text,
	"activeOrganizationId" text
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp(3),
	"refreshTokenExpiresAt" timestamp(3),
	"scope" text,
	"password" text,
	"createdAt" timestamp(3) NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "twoFactor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backupCodes" text NOT NULL,
	"userId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"logo" text,
	"createdAt" timestamp(3) NOT NULL,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"userId" text NOT NULL,
	"role" text NOT NULL,
	"createdAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organizationId" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text NOT NULL,
	"expiresAt" timestamp(3) NOT NULL,
	"inviterId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "thread_view" (
	"id" text PRIMARY KEY NOT NULL,
	"threadId" text NOT NULL,
	"userId" text NOT NULL,
	"ipAddress" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reaction" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "ReactionType" NOT NULL,
	"threadId" text,
	"postId" text,
	"userId" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookmark" (
	"id" text PRIMARY KEY NOT NULL,
	"threadId" text NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "NotificationType" NOT NULL,
	"userId" text NOT NULL,
	"actorId" text,
	"entityId" text NOT NULL,
	"entityType" "EntityType" NOT NULL,
	"isRead" boolean DEFAULT false NOT NULL,
	"title" text,
	"message" text,
	"link" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_badge" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"badgeId" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "badge" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image" text,
	"criteria" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "ReportType" NOT NULL,
	"reason" text NOT NULL,
	"details" text,
	"status" "ReportStatus" DEFAULT 'PENDING' NOT NULL,
	"threadId" text,
	"postId" text,
	"reporterId" text NOT NULL,
	"reportedId" text,
	"resolution" text,
	"closedById" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp(3) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean NOT NULL,
	"image" text,
	"createdAt" timestamp(3) NOT NULL,
	"updatedAt" timestamp(3) NOT NULL,
	"twoFactorEnabled" boolean,
	"banned" boolean DEFAULT false NOT NULL,
	"banReason" text,
	"banExpires" timestamp(3),
	"bio" text,
	"location" text,
	"reputation" integer DEFAULT 0 NOT NULL,
	"signature" text,
	"website" text,
	"role" "UserRole" DEFAULT 'user' NOT NULL,
	"displayUsername" text,
	"username" text,
	"metadata" text,
	"profileUpdatedAt" timestamp(3)
);
--> statement-breakpoint
CREATE TABLE "thread_tag" (
	"threadId" text NOT NULL,
	"tagId" text NOT NULL,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "thread_tag_pkey" PRIMARY KEY("threadId","tagId")
);
--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "category_moderator" ADD CONSTRAINT "category_moderator_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "category_moderator" ADD CONSTRAINT "category_moderator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "thread" ADD CONSTRAINT "thread_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "thread" ADD CONSTRAINT "thread_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "thread" ADD CONSTRAINT "thread_solutionPostId_fkey" FOREIGN KEY ("solutionPostId") REFERENCES "public"."post"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."thread"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "post" ADD CONSTRAINT "post_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."post"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "twoFactor" ADD CONSTRAINT "twoFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "thread_view" ADD CONSTRAINT "thread_view_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."thread"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "thread_view" ADD CONSTRAINT "thread_view_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "reaction" ADD CONSTRAINT "reaction_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."thread"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "reaction" ADD CONSTRAINT "reaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "reaction" ADD CONSTRAINT "reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."thread"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_badge" ADD CONSTRAINT "user_badge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_badge" ADD CONSTRAINT "user_badge_badgeId_fkey" FOREIGN KEY ("badgeId") REFERENCES "public"."badge"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."thread"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."post"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_reportedId_fkey" FOREIGN KEY ("reportedId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "thread_tag" ADD CONSTRAINT "thread_tag_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."thread"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "thread_tag" ADD CONSTRAINT "thread_tag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "public"."tag"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "category_slug_key" ON "category" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "category_moderator_categoryId_userId_key" ON "category_moderator" USING btree ("categoryId" text_ops,"userId" text_ops);--> statement-breakpoint
CREATE INDEX "thread_authorId_idx" ON "thread" USING btree ("authorId" text_ops);--> statement-breakpoint
CREATE INDEX "thread_categoryId_idx" ON "thread" USING btree ("categoryId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "thread_slug_categoryId_key" ON "thread" USING btree ("slug" text_ops,"categoryId" text_ops);--> statement-breakpoint
CREATE INDEX "post_authorId_idx" ON "post" USING btree ("authorId" text_ops);--> statement-breakpoint
CREATE INDEX "post_threadId_idx" ON "post" USING btree ("threadId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "tag_name_key" ON "tag" USING btree ("name" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "tag_slug_key" ON "tag" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "session_token_key" ON "session" USING btree ("token" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "organization_slug_key" ON "organization" USING btree ("slug" text_ops);--> statement-breakpoint
CREATE INDEX "thread_view_threadId_idx" ON "thread_view" USING btree ("threadId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "thread_view_threadId_userId_key" ON "thread_view" USING btree ("threadId" text_ops,"userId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "reaction_userId_threadId_postId_type_key" ON "reaction" USING btree ("userId" text_ops,"threadId" text_ops,"postId" text_ops,"type" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "bookmark_threadId_userId_key" ON "bookmark" USING btree ("threadId" text_ops,"userId" text_ops);--> statement-breakpoint
CREATE INDEX "notification_userId_idx" ON "notification" USING btree ("userId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "user_badge_userId_badgeId_key" ON "user_badge" USING btree ("userId" text_ops,"badgeId" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "badge_name_key" ON "badge" USING btree ("name" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "user_email_key" ON "user" USING btree ("email" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "user_username_key" ON "user" USING btree ("username" text_ops);
*/