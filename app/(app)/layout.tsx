import Navbar from "@/components/Navbar";
import { logout } from "@/lib/actions";
import { requireUser } from "@/lib/session";

/**
 * The session guard for every authenticated route — one `requireUser()` here
 * replaces the per-route `guard()` wrapper the hash router needed, and it runs
 * on the server, so an unauthenticated visitor never receives the page at all.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <Navbar user={user} logoutAction={logout} />
      <main className="mx-auto w-full max-w-[1600px] min-w-0 flex-1 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
