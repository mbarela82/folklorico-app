// frontend/src/app/update-password/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabaseServer";
import UpdatePasswordForm from "./UpdatePasswordForm";

export const dynamic = "force-dynamic";

export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();

  // No session? redirect BEFORE render (prevents the flash)
  if (!data.session) redirect("/login");

  return <UpdatePasswordForm />;
}
