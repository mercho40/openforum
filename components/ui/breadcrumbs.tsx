import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href: string;
  current?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav className={cn("flex", className)} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;

          return (
            <li key={i} className="inline-flex items-center">
              {i > 0 && (
                <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
              )}

              {isLast || item.current ? (
                <span
                  className={cn(
                    "text-sm font-medium",
                    (isLast || item.current) ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
