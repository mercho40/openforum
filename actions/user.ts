"use server"

import { db } from "@/db/drizzle"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { Session } from "@/lib/auth"
import { post, thread, user } from "@/db/schema" // Import the user table from your schema
import { asc, count, desc, eq, ilike, or } from "drizzle-orm"

interface ProfileUpdateData {
  bio?: string
  signature?: string
  website?: string
  location?: string
  displayUsername?: string
  image?: string
}

export async function updateUserProfile(data: ProfileUpdateData) {
  try {
    // const session: Session | null = await auth.api.getSession({
    //   headers: await headers()
    // })
    // if (!session?.user?.id) {
    //   throw new Error("Not authenticated")
    // }
    //
    // Filter out undefined values
    const updatableData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined)
    )

    // Use Drizzle to update the user
    // await db.update(user)
    //   .set({
    //     bio: updatableData.bio,
    //     signature: updatableData.signature,
    //     website: updatableData.website,
    //     location: updatableData.location,
    //     displayUsername: updatableData.displayUsername,
    //     image: updatableData.image,
    //     updatedAt: new Date() // Update the updatedAt timestamp
    //   })
    //   .where(eq(user.id, session.user.id));
    try {
      await auth.api.updateUser({
        body: {
          bio: updatableData.bio,
          signature: updatableData.signature,
          website: updatableData.website,
          location: updatableData.location,
          displayUsername: updatableData.displayUsername,
          image: updatableData.image,
        },
        headers: await headers(),
      })
    } catch (error) {
      console.error("Error updating user profile:", error)
      throw new Error("Failed to update user profile")
    }


    revalidatePath('/profile')
    revalidatePath('/')

    return { success: true }
  } catch (error) {
    console.error("Error updating user profile:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update profile"
    }
  }
}

// Track if the user has seen the profile completion form
export async function markProfileSetupSeen() {
  // try {
  //   const session: Session | null = await auth.api.getSession({
  //     headers: await headers()
  //   })
  //
  //   if (!session?.user?.id) {
  //     throw new Error("Not authenticated")
  //   }
  //
  //   // Use Drizzle to update metadata
  //   await db.update(user)
  //     .set({
  //       metadata: JSON.stringify({ profileSetupSeen: true }),
  //       updatedAt: new Date()
  //     })
  //     .where(eq(user.id, session.user.id));
  //
  //   return { success: true }
  // } catch (error) {
  //   console.error("Error marking profile setup as seen:", error)
  //   return { success: false }
  // }
  try {
    await auth.api.updateUser({
      body: {
        metadata: JSON.stringify({ profileSetupSeen: true }),
      },
      headers: await headers(),
    })
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw new Error("Failed to update user profile")
  }
}

// Check if user has completed their profile
// export async function checkProfileCompletion() {
//   try {
//     const session = await auth.api.getSession({
//       headers: await headers()
//     })
//
//     if (!session?.user?.id) {
//       throw new Error("Not authenticated")
//     }
//
//     const users = await db.select({
//       bio: user.bio,
//       image: user.image,
//       metadata: user.metadata
//     })
//       .from(user)
//       .where(eq(user.id, session.user.id))
//       .limit(1);
//
//     const userData = users[0];
//
//     // Parse metadata if it exists
//     const metadata = userData?.metadata ? JSON.parse(userData.metadata as string) : {}
//
//     return {
//       success: true,
//       isComplete: Boolean(userData?.bio && userData?.image),
//       hasSeenSetup: Boolean(metadata.profileSetupSeen)
//     }
//   } catch (error) {
//     console.error("Error checking profile completion:", error)
//     return {
//       success: false,
//       isComplete: false,
//       hasSeenSetup: false
//     }
//   }
// }
//
// // Fetch user profile data
// export async function fetchUserProfile() {
//   try {
//     const session = await auth.api.getSession({
//       headers: await headers()
//     })
//
//     if (!session?.user?.id) {
//       throw new Error("Not authenticated")
//     }
//
//     const users = await db.select({
//       bio: user.bio,
//       image: user.image,
//       metadata: user.metadata
//     })
//       .from(user)
//       .where(eq(user.id, session.user.id))
//       .limit(1);
//
//     const userData = users[0];
//
//     // Parse metadata if it exists
//     const metadata = userData?.metadata ? JSON.parse(userData.metadata as string) : {}
//
//     return {
//       success: true,
//       user: { ...userData, metadata }
//     }
//   } catch (error) {
//     console.error("Error fetching user profile:", error)
//     return {
//       success: false,
//       error: error instanceof Error ? error.message : "Failed to fetch profile"
//     }
//   }
// }

export async function UpdatePassword(newPassword: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user?.id) {
      throw new Error("Not authenticated")
    } else {
      const ctx = await auth.$context;
      const hash = await ctx.password.hash(newPassword);
      await ctx.internalAdapter.updatePassword(session?.user?.id, hash)
    }

  }
  catch (error) {
    console.error("Error fetching user profile:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch profile"
    }
  }
}

export async function getUserProfile(userId: string) {
  try {
    // Fetch the user data
    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        username: user.username,
        displayUsername: user.displayUsername,
        bio: user.bio,
        signature: user.signature,
        website: user.website,
        location: user.location,
        reputation: user.reputation,
        createdAt: user.createdAt,
        role: user.role,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!users.length) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Get thread count
    const threadCount = await db
      .select({ count: count() })
      .from(thread)
      .where(eq(thread.authorId, userId));

    // Get post count
    const postCount = await db
      .select({ count: count() })
      .from(post)
      .where(eq(post.authorId, userId));

    // Get recent threads (limit to 5 for profile view)
    const threads = await db.query.thread.findMany({
      where: eq(thread.authorId, userId),
      with: {
        category: {
          columns: {
            id: true,
            name: true,
            slug: true,
          }
        }
      },
      columns: {
        id: true,
        title: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
        isPinned: true,
        isLocked: true,
        viewCount: true,
        replyCount: true,
      },
      orderBy: [desc(thread.createdAt)],
      limit: 5,
    });

    // Get recent posts (limit to 5 for profile view)
    const posts = await db.query.post.findMany({
      where: eq(post.authorId, userId),
      with: {
        thread: {
          columns: {
            id: true,
            title: true,
            slug: true,
          },
          with: {
            category: {
              columns: {
                id: true,
                name: true,
                slug: true,
              }
            }
          }
        }
      },
      columns: {
        id: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [desc(post.createdAt)],
      limit: 5,
    });

    // Get like counts for threads and posts
    const threadsWithCounts = await Promise.all(
      threads.map(async (threadItem) => {
        // Get post count for this thread (replies)
        const postCountResult = await db
          .select({ count: count() })
          .from(post)
          .where(eq(post.threadId, threadItem.id));

        // Get like count for the initial post of this thread
        const initialPost = await db.query.post.findFirst({
          where: eq(post.threadId, threadItem.id),
          orderBy: [asc(post.createdAt)],
          with: {
            votes: true
          }
        });

        const likeCount = initialPost?.votes.filter(vote => vote.value === 1).length || 0;

        return {
          ...threadItem,
          _count: {
            posts: postCountResult[0]?.count || 0,
            likes: likeCount
          }
        };
      })
    );

    const postsWithCounts = await Promise.all(
      posts.map(async (postItem) => {
        // Get like count for this post
        const postWithVotes = await db.query.post.findFirst({
          where: eq(post.id, postItem.id),
          with: {
            votes: true
          }
        });

        const likeCount = postWithVotes?.votes.filter(vote => vote.value === 1).length || 0;

        return {
          ...postItem,
          _count: {
            likes: likeCount
          }
        };
      })
    );

    // Combine user data with activity counts
    const userData = {
      ...users[0],
      threadCount: threadCount[0]?.count || 0,
      postCount: postCount[0]?.count || 0,
      threads: threadsWithCounts,
      posts: postsWithCounts,
    };

    return {
      success: true,
      userData,
    };
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch user profile",
    };
  }
}

// Fetch forum members with pagination and filtering options
export async function getForumMembers({
  page = 1,
  search = "",
  sort = "newest",
  limit = 20,
}) {
  try {
    const offset = (page - 1) * limit;
    
    // Base query
    let baseQuery = db
      .select({
        id: user.id,
        name: user.name,
        username: user.username,
        displayUsername: user.displayUsername,
        image: user.image,
        bio: user.bio,
        reputation: user.reputation,
        createdAt: user.createdAt,
        role: user.role,
      })
      .from(user);

    // Add search filter if provided
    const query = search
      ? baseQuery.where(
          or(
            ilike(user.name, `%${search}%`),
            ilike(user.username, `%${search}%`),
            ilike(user.displayUsername, `%${search}%`)
          )
        )
      : baseQuery;
    
    // Determine orderBy clause
    let orderByClause;
    switch (sort) {
      case "oldest":
        orderByClause = asc(user.createdAt);
        break;
      case "reputation":
        orderByClause = desc(user.reputation);
        break;
      case "name":
        orderByClause = asc(user.name);
        break;
      case "newest":
      default:
        orderByClause = desc(user.createdAt);
        break;
    }
    
    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: count() })
      .from(user)
      .where(search ? 
        or(
          ilike(user.name, `%${search}%`),
          ilike(user.username, `%${search}%`),
          ilike(user.displayUsername, `%${search}%`)
        ) : 
        undefined
      );
    
    // Execute the paginated query with orderBy
    const members = await (search
      ? query
      : query // no-op, but keeps the chain consistent
    )
      .orderBy(orderByClause)
      .limit(limit)
      .offset(offset);
    
    // Pagination data
    const totalItems = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / limit);
    
    return {
      success: true,
      members,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    console.error("Error fetching forum members:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch forum members",
      members: [],
      pagination: {
        currentPage: page,
        totalPages: 0,
        totalItems: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    };
  }
}
