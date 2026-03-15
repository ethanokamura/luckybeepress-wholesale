import type { Metadata } from "next";
import ApplyForm from "./apply-form";

export const metadata: Metadata = {
  title: "Apply for Wholesale",
  description:
    "Apply for a Lucky Bee Press wholesale account. We welcome boutiques, gift shops, bookstores, and online retailers.",
};

export default function ApplyPage() {
  return <ApplyForm />;
}
