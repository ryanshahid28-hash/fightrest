import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Fight Club",
  description: "Your daily productivity command center. Track tasks, build streaks, and stay in fight mode.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
