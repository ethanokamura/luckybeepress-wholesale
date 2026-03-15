import { randomUUID } from "crypto";

export function generateOrderNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = randomUUID().slice(0, 6).toUpperCase();
  return `LBP-${y}${m}${d}-${rand}`;
}
