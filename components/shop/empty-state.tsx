import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="relative flex flex-col items-center gap-4 rounded-xl bg-secondary/50 p-14 text-center">
      <div className="honeycomb-bg opacity-8 absolute inset-0 -z-0 rounded-xl" aria-hidden="true" />
      {Icon ? (
        <div className="animate-float relative z-10 flex size-14 items-center justify-center rounded-full bg-primary/10">
          <Icon className="size-6 text-primary-text" />
        </div>
      ) : null}
      <div className="relative z-10 flex flex-col gap-1.5">
        <p className="text-lg font-medium">{title}</p>
        {description ? (
          <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
        ) : null}
      </div>
      {actionLabel && actionHref ? (
        <Button variant="default" asChild className="relative z-10">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}
