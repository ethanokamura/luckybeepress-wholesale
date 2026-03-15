import type { Metadata } from "next";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to your Lucky Bee Press wholesale account to browse the catalog and place orders.",
};

export default function LoginPage() {
  return <LoginForm />;
}
