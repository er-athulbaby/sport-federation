import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function DashboardRedirect() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "admin") {
    redirect("/admin");
  }

  redirect("/federation");
}
