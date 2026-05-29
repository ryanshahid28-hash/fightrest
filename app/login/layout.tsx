import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — Fight Club",
  description: "Enter the ring. Sign in to your Fight Club productivity dashboard.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
