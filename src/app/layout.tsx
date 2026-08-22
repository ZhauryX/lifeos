import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LIFEOS — Student Mission Control",
  description: "Priority engine, focus timer, and risk analysis for student workload management.",
};

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}