import { relations } from "drizzle-orm/relations";
import { category, categoryModerator, user, thread, post, session, account, twoFactor, organization, member, invitation, threadView, reaction, bookmark, notification, userBadge, badge, report, threadTag, tag } from "./schema";

export const categoryRelations = relations(category, ({one, many}) => ({
	category: one(category, {
		fields: [category.parentId],
		references: [category.id],
		relationName: "category_parentId_category_id"
	}),
	categories: many(category, {
		relationName: "category_parentId_category_id"
	}),
	categoryModerators: many(categoryModerator),
	threads: many(thread),
}));

export const categoryModeratorRelations = relations(categoryModerator, ({one}) => ({
	category: one(category, {
		fields: [categoryModerator.categoryId],
		references: [category.id]
	}),
	user: one(user, {
		fields: [categoryModerator.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	categoryModerators: many(categoryModerator),
	threads: many(thread),
	posts: many(post),
	sessions: many(session),
	accounts: many(account),
	twoFactors: many(twoFactor),
	members: many(member),
	invitations: many(invitation),
	threadViews: many(threadView),
	reactions: many(reaction),
	bookmarks: many(bookmark),
	notifications: many(notification),
	userBadges: many(userBadge),
	reports_reporterId: many(report, {
		relationName: "report_reporterId_user_id"
	}),
	reports_reportedId: many(report, {
		relationName: "report_reportedId_user_id"
	}),
}));

export const threadRelations = relations(thread, ({one, many}) => ({
	category: one(category, {
		fields: [thread.categoryId],
		references: [category.id]
	}),
	user: one(user, {
		fields: [thread.authorId],
		references: [user.id]
	}),
	post: one(post, {
		fields: [thread.solutionPostId],
		references: [post.id],
		relationName: "thread_solutionPostId_post_id"
	}),
	posts: many(post, {
		relationName: "post_threadId_thread_id"
	}),
	threadViews: many(threadView),
	reactions: many(reaction),
	bookmarks: many(bookmark),
	reports: many(report),
	threadTags: many(threadTag),
}));

export const postRelations = relations(post, ({one, many}) => ({
	threads: many(thread, {
		relationName: "thread_solutionPostId_post_id"
	}),
	thread: one(thread, {
		fields: [post.threadId],
		references: [thread.id],
		relationName: "post_threadId_thread_id"
	}),
	user: one(user, {
		fields: [post.authorId],
		references: [user.id]
	}),
	post: one(post, {
		fields: [post.parentId],
		references: [post.id],
		relationName: "post_parentId_post_id"
	}),
	posts: many(post, {
		relationName: "post_parentId_post_id"
	}),
	reactions: many(reaction),
	reports: many(report),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const twoFactorRelations = relations(twoFactor, ({one}) => ({
	user: one(user, {
		fields: [twoFactor.userId],
		references: [user.id]
	}),
}));

export const memberRelations = relations(member, ({one}) => ({
	organization: one(organization, {
		fields: [member.organizationId],
		references: [organization.id]
	}),
	user: one(user, {
		fields: [member.userId],
		references: [user.id]
	}),
}));

export const organizationRelations = relations(organization, ({many}) => ({
	members: many(member),
	invitations: many(invitation),
}));

export const invitationRelations = relations(invitation, ({one}) => ({
	organization: one(organization, {
		fields: [invitation.organizationId],
		references: [organization.id]
	}),
	user: one(user, {
		fields: [invitation.inviterId],
		references: [user.id]
	}),
}));

export const threadViewRelations = relations(threadView, ({one}) => ({
	thread: one(thread, {
		fields: [threadView.threadId],
		references: [thread.id]
	}),
	user: one(user, {
		fields: [threadView.userId],
		references: [user.id]
	}),
}));

export const reactionRelations = relations(reaction, ({one}) => ({
	thread: one(thread, {
		fields: [reaction.threadId],
		references: [thread.id]
	}),
	post: one(post, {
		fields: [reaction.postId],
		references: [post.id]
	}),
	user: one(user, {
		fields: [reaction.userId],
		references: [user.id]
	}),
}));

export const bookmarkRelations = relations(bookmark, ({one}) => ({
	thread: one(thread, {
		fields: [bookmark.threadId],
		references: [thread.id]
	}),
	user: one(user, {
		fields: [bookmark.userId],
		references: [user.id]
	}),
}));

export const notificationRelations = relations(notification, ({one}) => ({
	user: one(user, {
		fields: [notification.userId],
		references: [user.id]
	}),
}));

export const userBadgeRelations = relations(userBadge, ({one}) => ({
	user: one(user, {
		fields: [userBadge.userId],
		references: [user.id]
	}),
	badge: one(badge, {
		fields: [userBadge.badgeId],
		references: [badge.id]
	}),
}));

export const badgeRelations = relations(badge, ({many}) => ({
	userBadges: many(userBadge),
}));

export const reportRelations = relations(report, ({one}) => ({
	thread: one(thread, {
		fields: [report.threadId],
		references: [thread.id]
	}),
	post: one(post, {
		fields: [report.postId],
		references: [post.id]
	}),
	user_reporterId: one(user, {
		fields: [report.reporterId],
		references: [user.id],
		relationName: "report_reporterId_user_id"
	}),
	user_reportedId: one(user, {
		fields: [report.reportedId],
		references: [user.id],
		relationName: "report_reportedId_user_id"
	}),
}));

export const threadTagRelations = relations(threadTag, ({one}) => ({
	thread: one(thread, {
		fields: [threadTag.threadId],
		references: [thread.id]
	}),
	tag: one(tag, {
		fields: [threadTag.tagId],
		references: [tag.id]
	}),
}));

export const tagRelations = relations(tag, ({many}) => ({
	threadTags: many(threadTag),
}));