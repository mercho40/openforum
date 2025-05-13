"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createPost } from "@/actions/post";
import { Loader2 } from "lucide-react";
import { Editor } from "@/components/editor";

interface NewPostFormProps {
  threadId: string;
  categorySlug: string;
  threadSlug: string;
  parentId?: string;
}

export function NewPostForm({
  threadId,
  categorySlug,
  threadSlug,
  parentId,
}: NewPostFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Post content cannot be empty");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("content", content);
    if (parentId) {
      formData.append("parentId", parentId);
    }

    try {
      const result = await createPost(threadId, formData);

      if (!result.success) {
        throw new Error(result.error);
      }

      toast.success("Your post has been created");

      if (result.redirect) {
        router.push(result.redirect);
      } else {
        router.push(`/categories/${categorySlug}/${threadSlug}`);
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create post");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Editor
          value={content}
          onChange={setContent}
          placeholder="Write your post here..."
          minHeight="200px"
        />
        {content.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Your post must be at least 5 characters long.
          </p>
        )}
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/categories/${categorySlug}/${threadSlug}`)}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || content.length < 5}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting
            </>
          ) : (
            "Post Reply"
          )}
        </Button>
      </div>
    </form>
  );
}
