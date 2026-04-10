import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { Button } from "@raketech/ui";
import Link from "next/link";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-4xl font-bold">RakeTech</h1>
        <p className="text-muted-foreground">Your app is up and running.</p>

        {session ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-muted-foreground">Signed in as Admin</p>
            <div className="flex gap-2">
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
              <Link href="/api/auth/signout">
                <Button variant="outline">Sign Out</Button>
              </Link>
            </div>
          </div>
        ) : (
          <Link href="/sign-in">
            <Button>Sign In</Button>
          </Link>
        )}
      </div>
    </main>
  );
}
