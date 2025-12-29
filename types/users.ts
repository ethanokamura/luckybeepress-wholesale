import { FirebaseDoc, CreateDoc, UpdateDoc } from "./base_types";

export type UserRole = "customer" | "admin";

export interface User extends FirebaseDoc {
  email: string;
  displayName: string;
  photoURL: string | null;
  phone: string | null;
  role: UserRole;
  defaultAddressId: string | null;
  emailVerified: boolean;
  accountStatus: "active" | "inactive" | "pending" | "suspended" | "deleted";
}

export type CreateUser = CreateDoc<User>;
export type UpdateUser = UpdateDoc<User>;
