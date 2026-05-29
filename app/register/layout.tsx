import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account — Fight Club",
  description: "Join the club. Create your Fight Club account and take control of your day.",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
