import { auth, signOut } from "@/auth";

export default async function AdminHome() {
  const session = await auth();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button className="text-sm text-slate-500 hover:text-slate-900">Sign out</button>
        </form>
      </div>
      <p className="text-slate-600">
        Signed in as <span className="font-medium">{session?.user.name}</span>.
      </p>
      <p className="mt-4 text-sm text-slate-400">
        Federations, sports, events, and games management will live here.
      </p>
    </div>
  );
}
