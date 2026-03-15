import { Badge } from "@/components/ui/badge";

export function ProductBadges({
  isAvailable,
  isBestSeller,
  isNewArrival,
  seasonalTag,
  direction = "row",
  max = 2,
}: {
  isAvailable: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  seasonalTag: string | null;
  direction?: "row" | "column";
  max?: number;
}) {
  const allBadges: { key: string; node: React.ReactNode }[] = [];

  if (!isAvailable)
    allBadges.push({ key: "unavailable", node: <Badge variant="secondary">Unavailable</Badge> });
  if (isBestSeller)
    allBadges.push({ key: "best-seller", node: <Badge variant="default">Best Seller</Badge> });
  if (seasonalTag)
    allBadges.push({ key: "seasonal", node: <Badge variant="secondary">{seasonalTag}</Badge> });
  if (isNewArrival)
    allBadges.push({ key: "new", node: <Badge variant="outline">New</Badge> });

  const visible = allBadges.slice(0, max);

  return (
    <div className={`flex ${direction === "row" ? "flex-row" : "flex-col"} gap-1`}>
      {visible.map((b) => (
        <span key={b.key}>{b.node}</span>
      ))}
    </div>
  );
}
