import { MobileAppShell } from "@/components/layout/MobileAppShell";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <MobileAppShell>{children}</MobileAppShell>;
}
