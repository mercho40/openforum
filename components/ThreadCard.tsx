import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Eye, MessageSquare } from "lucide-react";

interface Thread {
  id: string
  title: string
  slug: string
  createdAt?: Date
  viewCount: number
  replyCount: number
  isPinned?: boolean
  isLocked?: boolean
  categoryId: string
  categoryName: string
  categorySlug: string
  author?: {
    id: string
    name: string | null
    image: string | null
  }
}

export default function ThreadCard({ thread }: { thread: Thread }) {
  return (
    <div className="rounded-lg border bg-card/50 p-4 transition-colors hover:bg-muted/30">
      <div className="flex items-start gap-4">
        {thread.author && (
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={thread.author.image || ""} alt={thread.author.name || "User"} />
            <AvatarFallback>{thread.author.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Link href={`/forum/thread/${thread.slug}`} className="font-medium hover:text-primary line-clamp-1">
                  {thread.title}
                </Link>
                {thread.isPinned && (
                  <Badge variant="outline" className="text-xs">
                    Pinned
                  </Badge>
                )}
                {thread.isLocked && (
                  <Badge variant="outline" className="text-xs">
                    Locked
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Link href={`/forum/category/${thread.categorySlug}`} className="hover:text-foreground">
                  {thread.categoryName}
                </Link>
                {thread.createdAt && (
                  <>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}</span>
                  </>
                )}
                {thread.author && (
                  <>
                    <span>•</span>
                    <Link href={`/forum/profile/${thread.author.id}`} className="hover:text-foreground">
                      {thread.author.name}
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center">
                <MessageSquare className="mr-1 h-3 w-3" />
                {thread.replyCount}
              </div>
              <div className="flex items-center">
                <Eye className="mr-1 h-3 w-3" />
                {thread.viewCount}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}