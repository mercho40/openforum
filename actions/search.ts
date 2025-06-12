"use server";

import { searchThreads, buildFacetFilters, type AlgoliaThread, type SearchResults } from "@/lib/algolia";

export interface SearchFilters {
  categorySlug?: string;
  authorName?: string;
  tags?: string[];
  isPinned?: boolean;
  isLocked?: boolean;
}

export interface SearchParams {
  query: string;
  page?: number;
  perPage?: number;
  sortBy?: 'recent' | 'views' | 'replies';
  filters?: SearchFilters;
}

export interface ThreadSearchResult {
  success: boolean;
  threads: Thread[];
  pagination: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
  processingTime?: number;
  error?: string;
}

// Thread interface to match the existing SearchView component
interface Thread {
  id: string;
  title: string;
  slug: string;
  createdAt: Date;
  viewCount: number;
  replyCount: number;
  isPinned: boolean;
  isLocked: boolean;
  lastPostAt: Date;
  author: {
    id: string;
    name: string | null;
    image: string | null;
    username?: string | null;
    displayUsername?: string | null;
  };
  category: {
    id: string;
    name: string;
    slug: string;
    color: string | null;
    iconClass: string | null;
  };
  lastPost?: {
    createdAt: Date;
    author: {
      id: string;
      name: string | null;
      image: string | null;
    };
  } | null;
}

// Convert Algolia thread to component thread format
function convertAlgoliaThreadToThread(algoliaThread: AlgoliaThread): Thread {
  return {
    id: algoliaThread.objectID,
    title: algoliaThread.title,
    slug: algoliaThread.slug,
    createdAt: new Date(algoliaThread.createdAt),
    viewCount: algoliaThread.viewCount,
    replyCount: algoliaThread.replyCount,
    isPinned: algoliaThread.isPinned,
    isLocked: algoliaThread.isLocked,
    lastPostAt: new Date(algoliaThread.lastPostAt),
    author: {
      id: algoliaThread.authorId,
      name: algoliaThread.authorName,
      image: null, // Algolia doesn't store images currently
      username: algoliaThread.authorUsername,
      displayUsername: null
    },
    category: {
      id: algoliaThread.categoryId,
      name: algoliaThread.categoryName,
      slug: algoliaThread.categorySlug,
      color: algoliaThread.categoryColor,
      iconClass: algoliaThread.categoryIcon
    },
    lastPost: null // We'd need to store this in Algolia or fetch separately
  };
}

export async function searchForumThreads({
  query,
  page = 1,
  perPage = 10,
  sortBy = 'recent',
  filters = {}
}: SearchParams): Promise<ThreadSearchResult> {
  try {
    // If no query, return empty results
    if (!query.trim()) {
      return {
        success: true,
        threads: [],
        pagination: {
          total: 0,
          page: 1,
          perPage,
          totalPages: 0
        }
      };
    }

    // Convert category slug to category name for filtering
    let categoryName: string | undefined;
    if (filters.categorySlug) {
      // Import the category action to get category name from slug
      const { getCategoryData } = await import("./category");
      const categoryResult = await getCategoryData(filters.categorySlug);
      if (categoryResult.success && categoryResult.categoryData) {
        categoryName = categoryResult.categoryData.name;
      }
    }

    // Build facet filters
    const facetFilters = buildFacetFilters({
      categoryName,
      authorName: filters.authorName,
      tags: filters.tags,
      isPinned: filters.isPinned,
      isLocked: filters.isLocked
    });

    // Search using Algolia
    const results: SearchResults<AlgoliaThread> = await searchThreads({
      query: query.trim(),
      page: page - 1, // Algolia uses 0-based pagination
      hitsPerPage: perPage,
      facetFilters: facetFilters.length > 0 ? facetFilters : undefined,
      sortBy
    });

    // Convert Algolia threads to component format
    const threads = results.hits.map(convertAlgoliaThreadToThread);

    return {
      success: true,
      threads,
      pagination: {
        total: results.nbHits,
        page: results.page + 1, // Convert back to 1-based pagination
        perPage: results.hitsPerPage,
        totalPages: results.nbPages
      },
      processingTime: results.processingTimeMS
    };

  } catch (error) {
    console.error('Error searching forum threads:', error);
    return {
      success: false,
      threads: [],
      pagination: {
        total: 0,
        page: 1,
        perPage,
        totalPages: 0
      },
      error: error instanceof Error ? error.message : 'Search failed'
    };
  }
}

// Fallback function that uses the existing database search
import { getAllThreads } from "./thread";

export async function searchThreadsWithFallback({
  query,
  page = 1,
  perPage = 10,
  sortBy = 'recent',
  filters = {}
}: SearchParams): Promise<ThreadSearchResult> {
  try {
    // Try Algolia search first
    const algoliaResult = await searchForumThreads({
      query,
      page,
      perPage,
      sortBy,
      filters
    });

    // If Algolia search succeeds and has results, return it
    if (algoliaResult.success) {
      return algoliaResult;
    }

    // Fallback to database search
    console.log('Falling back to database search');
    const dbResult = await getAllThreads({
      page,
      perPage,
      searchQuery: query,
      sortBy,
      categoryId: filters.categorySlug,
      filter: filters.isPinned ? 'pinned' : filters.isLocked ? 'locked' : undefined
    });

    if (dbResult.success) {
      return {
        success: true,
        threads: dbResult.threads,
        pagination: dbResult.pagination
      };
    }

    throw new Error('Both Algolia and database search failed');

  } catch (error) {
    console.error('Error in search with fallback:', error);
    return {
      success: false,
      threads: [],
      pagination: {
        total: 0,
        page: 1,
        perPage,
        totalPages: 0
      },
      error: error instanceof Error ? error.message : 'Search failed'
    };
  }
}
