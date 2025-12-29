import { FirebaseDoc, CreateDoc, UpdateDoc } from "./base_types";

export type AddressType = "shipping" | "billing" | "both";

export interface Address extends FirebaseDoc {
  userId: string;
  label: string; // "Home", "Work", etc.
  type: AddressType;
  firstName: string;
  lastName: string;
  company: string | null;
  street1: string;
  street2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
}

export type CreateAddress = CreateDoc<Address>;
export type UpdateAddress = UpdateDoc<Address>;
