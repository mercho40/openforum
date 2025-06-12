import { algoliasearch } from 'algoliasearch';
// import { db } from '../db/drizzle';
import { thread, post, user, category, tag, threadTag } from '../db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

const client = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.ALGOLIA_ADMIN_API_KEY!
);
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "../db/schema";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema: schema })

const THREADS_INDEX = 'threads';
const POSTS_INDEX = 'posts';
const USERS_INDEX = 'users';
const CATEGORIES_INDEX = 'categories';
const TAGS_INDEX = 'tags';

interface AlgoliaThread {
  objectID: string;
  title: string;
  slug: string;
  content: string; // First post content
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  categoryColor: string;
  categoryIcon: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  isPinned: boolean;
  isLocked: boolean;
  viewCount: number;
  replyCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastPostAt: string;
}

interface AlgoliaPost {
  objectID: string;
  content: string;
  threadId: string;
  threadTitle: string;
  threadSlug: string;
  categoryId: string;
  categoryName: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AlgoliaUser {
  objectID: string;
  name: string;
  username: string;
  email: string;
  bio?: string;
  location?: string;
  website?: string;
  threadCount: number;
  postCount: number;
  isVerified: boolean;
  createdAt: string;
  lastActiveAt?: string;
}

interface AlgoliaCategory {
  objectID: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon: string;
  threadCount: number;
  postCount: number;
  isHidden: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface AlgoliaTag {
  objectID: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  threadCount: number;
  createdAt: string;
  updatedAt: string;
}

async function uploadThreadsToAlgolia() {
  console.log('📋 Fetching threads data...');
  
  // Fetch all threads with related data
  const threadsData = await db
    .select({
      thread: thread,
      author: user,
      category: category,
    })
    .from(thread)
    .leftJoin(user, eq(thread.authorId, user.id))
    .leftJoin(category, eq(thread.categoryId, category.id))
    .where(and(
      eq(thread.isHidden, false),
      isNull(user.banned)
    ));

  console.log(`📊 Found ${threadsData.length} threads`);

  const algoliaThreads: AlgoliaThread[] = [];

  for (const row of threadsData) {
    if (!row.thread || !row.author || !row.category) continue;

    // Get first post content for the thread
    const firstPost = await db
      .select({ content: post.content })
      .from(post)
      .where(eq(post.threadId, row.thread.id))
      .orderBy(post.createdAt)
      .limit(1);

    // Get tags for the thread
    const threadTags = await db
      .select({ name: tag.name })
      .from(threadTag)
      .leftJoin(tag, eq(threadTag.tagId, tag.id))
      .where(eq(threadTag.threadId, row.thread.id));

    const algoliaThread: AlgoliaThread = {
      objectID: row.thread.id,
      title: row.thread.title,
      slug: row.thread.slug,
      content: firstPost[0]?.content || '',
      categoryId: row.thread.categoryId,
      categoryName: row.category.name,
      categorySlug: row.category.slug,
      categoryColor: row.category.color || '#3498db',
      categoryIcon: row.category.iconClass || 'MessageSquare',
      authorId: row.thread.authorId,
      authorName: row.author.name,
      authorUsername: row.author.username || row.author.email,
      isPinned: row.thread.isPinned,
      isLocked: row.thread.isLocked,
      viewCount: row.thread.viewCount,
      replyCount: row.thread.replyCount,
      tags: threadTags.map(t => t.name).filter((name): name is string => Boolean(name)),
      createdAt: row.thread.createdAt.toISOString(),
      updatedAt: row.thread.updatedAt.toISOString(),
      lastPostAt: row.thread.lastPostAt.toISOString(),
    };

    algoliaThreads.push(algoliaThread);
  }

  console.log('🚀 Uploading threads to Algolia...');
  
  // Upload in batches
  const BATCH_SIZE = 1000;
  for (let i = 0; i < algoliaThreads.length; i += BATCH_SIZE) {
    const batch = algoliaThreads.slice(i, i + BATCH_SIZE);
    await client.saveObjects({
      indexName: THREADS_INDEX,
      objects: batch as unknown as Record<string, unknown>[]
    });
    console.log(`📤 Uploaded threads batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(algoliaThreads.length / BATCH_SIZE)}`);
  }

  console.log('⚙️ Configuring threads index settings...');
  // Try to configure index settings (may fail with v5 API changes)
  try {
    // Use direct API call for settings if the typed version doesn't work
    const response = await fetch(`https://${process.env.NEXT_PUBLIC_ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${THREADS_INDEX}/settings`, {
      method: 'PUT',
      headers: {
        'X-Algolia-Application-Id': process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
        'X-Algolia-API-Key': process.env.ALGOLIA_ADMIN_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        searchableAttributes: [
          'title',
          'content',
          'categoryName',
          'authorName',
          'authorUsername',
          'tags'
        ],
        attributesForFaceting: [
          'categoryName',
          'authorName',
          'tags',
          'isPinned',
          'isLocked'
        ],
        ranking: [
          'typo',
          'geo',
          'words',
          'filters',
          'proximity',
          'attribute',
          'exact',
          'custom'
        ],
        customRanking: [
          'desc(isPinned)',
          'desc(viewCount)',
          'desc(replyCount)',
          'desc(lastPostAt)'
        ]
      })
    });
    
    if (response.ok) {
      console.log('✅ Index settings configured successfully');
    } else {
      console.warn('⚠️ Could not configure index settings, but data uploaded successfully');
    }
  } catch (error) {
    console.warn('⚠️ Could not configure index settings, but data uploaded successfully:', error);
  }

  console.log(`✅ Successfully uploaded ${algoliaThreads.length} threads to Algolia`);
}

async function uploadPostsToAlgolia() {
  console.log('📋 Fetching posts data...');
  
  // Fetch all posts with related data
  const postsData = await db
    .select({
      post: post,
      author: user,
      thread: thread,
      category: category,
    })
    .from(post)
    .leftJoin(user, eq(post.authorId, user.id))
    .leftJoin(thread, eq(post.threadId, thread.id))
    .leftJoin(category, eq(thread.categoryId, category.id))
    .where(and(
      eq(post.isHidden, false),
      eq(post.isDeleted, false),
      eq(thread.isHidden, false),
      isNull(user.banned)
    ));

  console.log(`📊 Found ${postsData.length} posts`);

  const algoliaPosts: AlgoliaPost[] = postsData
    .filter(row => row.post && row.author && row.thread && row.category)
    .map(row => ({
      objectID: row.post!.id,
      content: row.post!.content,
      threadId: row.post!.threadId,
      threadTitle: row.thread!.title,
      threadSlug: row.thread!.slug,
      categoryId: row.thread!.categoryId,
      categoryName: row.category!.name,
      authorId: row.post!.authorId,
      authorName: row.author!.name,
      authorUsername: row.author!.username || row.author!.email,
      isEdited: row.post!.isEdited,
      createdAt: row.post!.createdAt.toISOString(),
      updatedAt: row.post!.updatedAt.toISOString(),
    }));

  console.log('🚀 Uploading posts to Algolia...');
  
  // Upload in batches
  const BATCH_SIZE = 1000;
  for (let i = 0; i < algoliaPosts.length; i += BATCH_SIZE) {
    const batch = algoliaPosts.slice(i, i + BATCH_SIZE);
    await client.saveObjects({
      indexName: POSTS_INDEX,
      objects: batch as unknown as Record<string, unknown>[]
    });
    console.log(`📤 Uploaded posts batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(algoliaPosts.length / BATCH_SIZE)}`);
  }

  console.log('⚙️ Configuring posts index settings...');
  // Try to configure index settings
  try {
    const response = await fetch(`https://${process.env.NEXT_PUBLIC_ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${POSTS_INDEX}/settings`, {
      method: 'PUT',
      headers: {
        'X-Algolia-Application-Id': process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
        'X-Algolia-API-Key': process.env.ALGOLIA_ADMIN_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        searchableAttributes: [
          'content',
          'threadTitle',
          'categoryName',
          'authorName',
          'authorUsername'
        ],
        attributesForFaceting: [
          'categoryName',
          'authorName',
          'threadTitle',
          'isEdited'
        ],
        ranking: [
          'typo',
          'geo',
          'words',
          'filters',
          'proximity',
          'attribute',
          'exact',
          'custom'
        ],
        customRanking: [
          'desc(createdAt)'
        ]
      })
    });
    
    if (response.ok) {
      console.log('✅ Posts index settings configured successfully');
    } else {
      console.warn('⚠️ Could not configure posts index settings, but data uploaded successfully');
    }
  } catch (error) {
    console.warn('⚠️ Could not configure posts index settings, but data uploaded successfully:', error);
  }

  console.log(`✅ Successfully uploaded ${algoliaPosts.length} posts to Algolia`);
}

async function uploadUsersToAlgolia() {
  console.log('📋 Fetching users data...');
  
  // Fetch all users (excluding banned ones) with thread and post counts
  const usersData = await db
    .select({
      user: user,
    })
    .from(user)
    .where(isNull(user.banned));

  console.log(`📊 Found ${usersData.length} users`);

  const algoliaUsers: AlgoliaUser[] = [];

  for (const row of usersData) {
    if (!row.user) continue;

    // Get thread count
    const [{ threadCount }] = await db
      .select({ threadCount: sql<number>`count(*)` })
      .from(thread)
      .where(eq(thread.authorId, row.user.id));

    // Get post count
    const [{ postCount }] = await db
      .select({ postCount: sql<number>`count(*)` })
      .from(post)
      .where(eq(post.authorId, row.user.id));

    const algoliaUser: AlgoliaUser = {
      objectID: row.user.id,
      name: row.user.name,
      username: row.user.username || row.user.email,
      email: row.user.email,
      bio: row.user.bio || undefined,
      location: row.user.location || undefined,
      website: row.user.website || undefined,
      threadCount,
      postCount,
      isVerified: row.user.emailVerified,
      createdAt: row.user.createdAt.toISOString(),
      lastActiveAt: row.user.updatedAt.toISOString(),
    };

    algoliaUsers.push(algoliaUser);
  }

  console.log('🚀 Uploading users to Algolia...');
  
  // Upload in batches
  const BATCH_SIZE = 1000;
  for (let i = 0; i < algoliaUsers.length; i += BATCH_SIZE) {
    const batch = algoliaUsers.slice(i, i + BATCH_SIZE);
    await client.saveObjects({
      indexName: USERS_INDEX,
      objects: batch as unknown as Record<string, unknown>[]
    });
    console.log(`📤 Uploaded users batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(algoliaUsers.length / BATCH_SIZE)}`);
  }

  console.log('⚙️ Configuring users index settings...');
  try {
    const response = await fetch(`https://${process.env.NEXT_PUBLIC_ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${USERS_INDEX}/settings`, {
      method: 'PUT',
      headers: {
        'X-Algolia-Application-Id': process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
        'X-Algolia-API-Key': process.env.ALGOLIA_ADMIN_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        searchableAttributes: [
          'name',
          'username',
          'bio',
          'location'
        ],
        attributesForFaceting: [
          'isVerified',
          'location'
        ],
        ranking: [
          'typo',
          'geo',
          'words',
          'filters',
          'proximity',
          'attribute',
          'exact',
          'custom'
        ],
        customRanking: [
          'desc(threadCount)',
          'desc(postCount)',
          'desc(createdAt)'
        ]
      })
    });
    
    if (response.ok) {
      console.log('✅ Users index settings configured successfully');
    } else {
      console.warn('⚠️ Could not configure users index settings, but data uploaded successfully');
    }
  } catch (error) {
    console.warn('⚠️ Could not configure users index settings, but data uploaded successfully:', error);
  }

  console.log(`✅ Successfully uploaded ${algoliaUsers.length} users to Algolia`);
}

async function uploadCategoriesToAlgolia() {
  console.log('📋 Fetching categories data...');
  
  // Fetch all visible categories with thread and post counts
  const categoriesData = await db
    .select({
      category: category,
    })
    .from(category)
    .where(eq(category.isHidden, false));

  console.log(`📊 Found ${categoriesData.length} categories`);

  const algoliaCategories: AlgoliaCategory[] = [];

  for (const row of categoriesData) {
    if (!row.category) continue;

    // Get thread count for this category
    const [{ threadCount }] = await db
      .select({ threadCount: sql<number>`count(*)` })
      .from(thread)
      .where(eq(thread.categoryId, row.category.id));

    // Get post count for threads in this category
    const [{ postCount }] = await db
      .select({ postCount: sql<number>`count(*)` })
      .from(post)
      .leftJoin(thread, eq(post.threadId, thread.id))
      .where(eq(thread.categoryId, row.category.id));

    const algoliaCategory: AlgoliaCategory = {
      objectID: row.category.id,
      name: row.category.name,
      slug: row.category.slug,
      description: row.category.description || undefined,
      color: row.category.color || '#3498db',
      icon: row.category.iconClass || 'MessageSquare',
      threadCount,
      postCount,
      isHidden: row.category.isHidden,
      order: row.category.displayOrder,
      createdAt: row.category.createdAt.toISOString(),
      updatedAt: row.category.updatedAt.toISOString(),
    };

    algoliaCategories.push(algoliaCategory);
  }

  console.log('🚀 Uploading categories to Algolia...');
  
  // Upload in batches
  const BATCH_SIZE = 1000;
  for (let i = 0; i < algoliaCategories.length; i += BATCH_SIZE) {
    const batch = algoliaCategories.slice(i, i + BATCH_SIZE);
    await client.saveObjects({
      indexName: CATEGORIES_INDEX,
      objects: batch as unknown as Record<string, unknown>[]
    });
    console.log(`📤 Uploaded categories batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(algoliaCategories.length / BATCH_SIZE)}`);
  }

  console.log('⚙️ Configuring categories index settings...');
  try {
    const response = await fetch(`https://${process.env.NEXT_PUBLIC_ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${CATEGORIES_INDEX}/settings`, {
      method: 'PUT',
      headers: {
        'X-Algolia-Application-Id': process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
        'X-Algolia-API-Key': process.env.ALGOLIA_ADMIN_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        searchableAttributes: [
          'name',
          'description'
        ],
        attributesForFaceting: [
          'isHidden'
        ],
        ranking: [
          'typo',
          'geo',
          'words',
          'filters',
          'proximity',
          'attribute',
          'exact',
          'custom'
        ],
        customRanking: [
          'asc(order)',
          'desc(threadCount)',
          'desc(postCount)'
        ]
      })
    });
    
    if (response.ok) {
      console.log('✅ Categories index settings configured successfully');
    } else {
      console.warn('⚠️ Could not configure categories index settings, but data uploaded successfully');
    }
  } catch (error) {
    console.warn('⚠️ Could not configure categories index settings, but data uploaded successfully:', error);
  }

  console.log(`✅ Successfully uploaded ${algoliaCategories.length} categories to Algolia`);
}

async function uploadTagsToAlgolia() {
  console.log('📋 Fetching tags data...');
  
  // Fetch all tags with thread counts
  const tagsData = await db
    .select({
      tag: tag,
    })
    .from(tag);

  console.log(`📊 Found ${tagsData.length} tags`);

  const algoliaTags: AlgoliaTag[] = [];

  for (const row of tagsData) {
    if (!row.tag) continue;

    // Get thread count for this tag
    const [{ threadCount }] = await db
      .select({ threadCount: sql<number>`count(*)` })
      .from(threadTag)
      .where(eq(threadTag.tagId, row.tag.id));

    const algoliaTag: AlgoliaTag = {
      objectID: row.tag.id,
      name: row.tag.name,
      slug: row.tag.slug,
      description: row.tag.description || undefined,
      color: row.tag.color || undefined,
      threadCount,
      createdAt: row.tag.createdAt.toISOString(),
      updatedAt: row.tag.updatedAt.toISOString(),
    };

    algoliaTags.push(algoliaTag);
  }

  console.log('🚀 Uploading tags to Algolia...');
  
  // Upload in batches
  const BATCH_SIZE = 1000;
  for (let i = 0; i < algoliaTags.length; i += BATCH_SIZE) {
    const batch = algoliaTags.slice(i, i + BATCH_SIZE);
    await client.saveObjects({
      indexName: TAGS_INDEX,
      objects: batch as unknown as Record<string, unknown>[]
    });
    console.log(`📤 Uploaded tags batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(algoliaTags.length / BATCH_SIZE)}`);
  }

  console.log('⚙️ Configuring tags index settings...');
  try {
    const response = await fetch(`https://${process.env.NEXT_PUBLIC_ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${TAGS_INDEX}/settings`, {
      method: 'PUT',
      headers: {
        'X-Algolia-Application-Id': process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
        'X-Algolia-API-Key': process.env.ALGOLIA_ADMIN_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        searchableAttributes: [
          'name',
          'description'
        ],
        attributesForFaceting: [],
        ranking: [
          'typo',
          'geo',
          'words',
          'filters',
          'proximity',
          'attribute',
          'exact',
          'custom'
        ],
        customRanking: [
          'desc(threadCount)',
          'desc(createdAt)'
        ]
      })
    });
    
    if (response.ok) {
      console.log('✅ Tags index settings configured successfully');
    } else {
      console.warn('⚠️ Could not configure tags index settings, but data uploaded successfully');
    }
  } catch (error) {
    console.warn('⚠️ Could not configure tags index settings, but data uploaded successfully:', error);
  }

  console.log(`✅ Successfully uploaded ${algoliaTags.length} tags to Algolia`);
}
async function main() {
  try {
    console.log('🔍 Starting Algolia search index build...');
    
    // Verify environment variables
    if (!process.env.NEXT_PUBLIC_ALGOLIA_APP_ID) {
      throw new Error('Missing NEXT_PUBLIC_ALGOLIA_APP_ID environment variable');
    }
    if (!process.env.ALGOLIA_ADMIN_API_KEY) {
      throw new Error('Missing ALGOLIA_ADMIN_API_KEY environment variable');
    }
    if (!process.env.DATABASE_URL) {
      throw new Error('Missing DATABASE_URL environment variable');
    }

    console.log(`📱 Using Algolia App ID: ${process.env.NEXT_PUBLIC_ALGOLIA_APP_ID}`);
    
    // Upload threads
    await uploadThreadsToAlgolia();
    
    // Upload posts
    await uploadPostsToAlgolia();
    
    // Upload users
    await uploadUsersToAlgolia();
    
    // Upload categories
    await uploadCategoriesToAlgolia();
    
    // Upload tags
    await uploadTagsToAlgolia();
    
    console.log('🎉 Algolia search index build completed successfully!');
    
  } catch (error) {
    console.error('❌ Error building Algolia search index:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { main as buildAlgoliaSearch };