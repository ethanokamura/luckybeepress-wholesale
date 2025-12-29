import { Timestamp } from "firebase/firestore";

export interface FirebaseDoc {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** For creating new documents (omit auto-generated fields) */
export type CreateDoc<T extends FirebaseDoc> = Omit<
  T,
  "id" | "createdAt" | "updatedAt"
>;

/** For updating documents (all fields optional except id) */
export type UpdateDoc<T extends FirebaseDoc> = Partial<
  Omit<T, "id" | "createdAt">
> & { updatedAt?: Timestamp };
