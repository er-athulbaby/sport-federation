import { auth } from "@/auth";
import SubAdminManager from "@/components/SubAdminManager";

export default async function SubAdminsPage() {
  const session = await auth();

  if (session?.user.adminRole !== "super_admin") {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-semibold text-slate-900">Sub-Admins</h1>
        <p className="text-sm text-slate-500">Only the super admin can manage sub-admin accounts.</p>
      </div>
    );
  }

  return <SubAdminManager />;
}
