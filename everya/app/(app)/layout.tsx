import { AppShell } from "@/components/layout/app-shell";
import { getAppLayoutData } from "@/lib/app-data";
import { getServerSession } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  const { repositories } = await getAppLayoutData();

  return (
    <AppShell repositories={session ? repositories : undefined}>
      {children}
    </AppShell>
  );
}
