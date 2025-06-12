import { algoliasearch } from 'algoliasearch';

if (!process.env.NEXT_PUBLIC_ALGOLIA_APP_ID) {
  throw new Error('Missing NEXT_PUBLIC_ALGOLIA_APP_ID environment variable');
}

if (!process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY) {
  throw new Error('Missing NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY environment variable');
}

const client = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!
);

const THREADS_INDEX = 'threads';
const POSTS_INDEX = 'posts';
const USERS_INDEX = 'users';
const CATEGORIES_INDEX = 'categories';
const TAGS_INDEX = 'tags';

export interface AlgoliaThread {
  objectID: string;
  title: string;
  slug: string;
  content: string;
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

export interface AlgoliaPost {
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

export interface AlgoliaUser {
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

export interface AlgoliaCategory {
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

export interface AlgoliaTag {
  objectID: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  threadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SearchOptions {
  query: string;
  page?: number;
  hitsPerPage?: number;
  filters?: string;
  facetFilters?: string[][];
  sortBy?: string;
}

export interface SearchResults<T = unknown> {
  hits: T[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
  processingTimeMS: number;
}

// Search threads
export async function searchThreads(options: SearchOptions): Promise<SearchResults<AlgoliaThread>> {
  const { query, page = 0, hitsPerPage = 10, filters, facetFilters, sortBy } = options;
  
  const searchParams: {
    query: string;
    page: number;
    hitsPerPage: number;
    filters?: string;
    facetFilters?: string[][];
  } = {
    query,
    page,
    hitsPerPage,
  };

  if (filters) {
    searchParams.filters = filters;
  }

  if (facetFilters) {
    searchParams.facetFilters = facetFilters;
  }

  // Handle sorting
  let indexName = THREADS_INDEX;
  if (sortBy) {
    switch (sortBy) {
      case 'views':
        indexName = `${THREADS_INDEX}_viewCount_desc`;
        break;
      case 'replies':
        indexName = `${THREADS_INDEX}_replyCount_desc`;
        break;
      case 'recent':
      default:
        indexName = THREADS_INDEX; // Uses default ranking
        break;
    }
  }

  const response = await client.search({
    requests: [{
      indexName,
      ...searchParams
    }]
  });

  return response.results[0] as unknown as SearchResults<AlgoliaThread>;
}

// Search posts
export async function searchPosts(options: SearchOptions): Promise<SearchResults<AlgoliaPost>> {
  const { query, page = 0, hitsPerPage = 10, filters, facetFilters } = options;
  
  const response = await client.search({
    requests: [{
      indexName: POSTS_INDEX,
      query,
      page,
      hitsPerPage,
      filters,
      facetFilters
    }]
  });

  return response.results[0] as unknown as SearchResults<AlgoliaPost>;
}

// Search users
export async function searchUsers(options: SearchOptions): Promise<SearchResults<AlgoliaUser>> {
  const { query, page = 0, hitsPerPage = 10, filters, facetFilters } = options;
  
  const response = await client.search({
    requests: [{
      indexName: USERS_INDEX,
      query,
      page,
      hitsPerPage,
      filters,
      facetFilters
    }]
  });

  return response.results[0] as unknown as SearchResults<AlgoliaUser>;
}

// Search categories
export async function searchCategories(options: SearchOptions): Promise<SearchResults<AlgoliaCategory>> {
  const { query, page = 0, hitsPerPage = 10, filters, facetFilters } = options;
  
  const response = await client.search({
    requests: [{
      indexName: CATEGORIES_INDEX,
      query,
      page,
      hitsPerPage,
      filters,
      facetFilters
    }]
  });

  return response.results[0] as unknown as SearchResults<AlgoliaCategory>;
}

// Search tags
export async function searchTags(options: SearchOptions): Promise<SearchResults<AlgoliaTag>> {
  const { query, page = 0, hitsPerPage = 10, filters, facetFilters } = options;
  
  const response = await client.search({
    requests: [{
      indexName: TAGS_INDEX,
      query,
      page,
      hitsPerPage,
      filters,
      facetFilters
    }]
  });

  return response.results[0] as unknown as SearchResults<AlgoliaTag>;
}

// Multi-index search for comprehensive results
export async function searchAll(options: SearchOptions) {
  const { query, page = 0, hitsPerPage = 10, filters, facetFilters } = options;
  
  const response = await client.search({
    requests: [
      {
        indexName: THREADS_INDEX,
        query,
        page,
        hitsPerPage,
        filters,
        facetFilters
      },
      {
        indexName: POSTS_INDEX,
        query,
        page,
        hitsPerPage: Math.ceil(hitsPerPage / 2),
        filters,
        facetFilters
      },
      {
        indexName: USERS_INDEX,
        query,
        page,
        hitsPerPage: Math.ceil(hitsPerPage / 4),
        filters,
        facetFilters
      },
      {
        indexName: CATEGORIES_INDEX,
        query,
        page,
        hitsPerPage: Math.ceil(hitsPerPage / 4),
        filters,
        facetFilters
      },
      {
        indexName: TAGS_INDEX,
        query,
        page,
        hitsPerPage: Math.ceil(hitsPerPage / 4),
        filters,
        facetFilters
      }
    ]
  });

  return {
    threads: response.results[0] as unknown as SearchResults<AlgoliaThread>,
    posts: response.results[1] as unknown as SearchResults<AlgoliaPost>,
    users: response.results[2] as unknown as SearchResults<AlgoliaUser>,
    categories: response.results[3] as unknown as SearchResults<AlgoliaCategory>,
    tags: response.results[4] as unknown as SearchResults<AlgoliaTag>
  };
}

// Helper function to build facet filters
export function buildFacetFilters(options: {
  categoryName?: string;
  authorName?: string;
  tags?: string[];
  isPinned?: boolean;
  isLocked?: boolean;
}): string[][] {
  const filters: string[][] = [];

  if (options.categoryName) {
    filters.push([`categoryName:${options.categoryName}`]);
  }

  if (options.authorName) {
    filters.push([`authorName:${options.authorName}`]);
  }

  if (options.tags && options.tags.length > 0) {
    filters.push(options.tags.map(tag => `tags:${tag}`));
  }

  if (options.isPinned !== undefined) {
    filters.push([`isPinned:${options.isPinned}`]);
  }

  if (options.isLocked !== undefined) {
    filters.push([`isLocked:${options.isLocked}`]);
  }

  return filters;
}
