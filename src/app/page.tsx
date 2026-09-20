import { AppShell } from "@/components/AppShell";

// Every screen reads the session cookie, so nothing here is prerenderable.
export const dynamic = "force-dynamic";

export default function Home() {
  return <AppShell />;
}
