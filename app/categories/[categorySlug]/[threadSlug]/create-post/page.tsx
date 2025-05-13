import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/prisma";
import { NewPostForm } from "./new-post-form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import type { Category, Post, Thread, User } from "@/generated/prisma";

export const metadata = {
  title: "Create New Post | OpenForum",
  description: "Contribute to the discussion by creating a new post",
};

// Define proper types instead of using any
type ThreadWithCategory = Thread & {
  category: Category;
};

type PostWithAuthor = Post & {
  author: User;
};

// First, we'll create a separate component for the content
function CreatePostContent({
  categorySlug,
  threadSlug,
  parentId,
  thread,
  category,
  parentPost,
}: {
  categorySlug: string;
  threadSlug: string;
  parentId?: string;
  thread: ThreadWithCategory;
  category: Category;
  parentPost: PostWithAuthor | null;
}) {
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Categories", href: "/categories" },
    { label: category.name, href: `/categories/${categorySlug}` },
    { label: thread.title, href: `/categories/${categorySlug}/${threadSlug}` },
    { label: "New Post", href: "#", current: true },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          {parentPost ? "Reply to Post" : "New Post"}
        </h1>
        <Button variant="outline" asChild>
          <Link href={`/categories/${categorySlug}/${threadSlug}`}>
            Cancel
          </Link>
        </Button>
      </div>

      {parentPost && (
        <div className="rounded-lg border p-4 bg-muted/20">
          <div className="flex items-center gap-2 mb-2">
            <Image
              src={parentPost.author.image || "/images/default-avatar.png"}
              alt={parentPost.author.name || "User"}
              width={32}
              height={32}
              className="rounded-full object-cover"
            />
            <div>
              <p className="font-medium">{parentPost.author.name}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(parentPost.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: parentPost.content }}
          />
        </div>
      )}

      <NewPostForm
        threadId={thread.id}
        categorySlug={categorySlug}
        threadSlug={threadSlug}
        parentId={parentId}
      />
    </div>
  );
}

// Then we'll create a separate async component for data fetching
async function PostFormContainer({
  categorySlug,
  threadSlug,
  parentId,
}: {
  categorySlug: string;
  threadSlug: string;
  parentId?: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect(`/login?callbackUrl=/categories/${categorySlug}/${threadSlug}`);
  }

  // Check if user is banned
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (user?.banned) {
    redirect(`/categories/${categorySlug}/${threadSlug}?error=Account+banned`);
  }

  // Get thread info
  const category = await prisma.category.findUnique({
    where: { slug: categorySlug },
  });

  if (!category) {
    redirect("/categories");
  }

  const thread = await prisma.thread.findUnique({
    where: {
      slug_categoryId: {
        slug: threadSlug,
        categoryId: category.id,
      },
    },
    include: {
      category: true,
    },
  });

  if (!thread) {
    redirect(`/categories/${categorySlug}`);
  }

  if (thread.isLocked) {
    redirect(
      `/categories/${categorySlug}/${threadSlug}?error=Thread+is+locked`
    );
  }

  // If it's a reply, get parent post information
  let parentPost = null;
  if (parentId) {
    parentPost = await prisma.post.findUnique({
      where: {
        id: parentId,
        threadId: thread.id,
      },
      include: {
        author: true,
      },
    });
  }

  return (
    <CreatePostContent
      categorySlug={categorySlug}
      threadSlug={threadSlug}
      parentId={parentId}
      thread={thread as ThreadWithCategory}
      category={category}
      parentPost={parentPost as PostWithAuthor | null}
    />
  );
}

// Define a proper type for the page props
type PageProps = {
  params: {
    categorySlug: string;
    threadSlug: string;
  };
  searchParams: {
    parentId?: string;
  };
};

// Finally, we'll use a properly typed page component
export default function Page(props: PageProps) {
  const { categorySlug, threadSlug } = props.params;
  const { parentId } = props.searchParams;

  return (
    <div className="container py-6 max-w-4xl">
      <Suspense
        fallback={
          <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        <PostFormContainer
          categorySlug={categorySlug}
          threadSlug={threadSlug}
          parentId={parentId}
        />
      </Suspense>
    </div>
  );
}
