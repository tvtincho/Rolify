import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import SuperadminClient from "./SuperadminClient";

export default async function SuperadminPage() {
  const session = await getServerSession(authOptions);
  if (!session) return redirect("/");
  if (!session.user.isSuperadmin) return redirect("/dashboard");
  return <SuperadminClient />;
}
