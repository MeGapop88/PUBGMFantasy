import { redirect } from "next/navigation";

import AuthForm from "@/components/AuthForm";
import { login, register } from "@/lib/actions";
import { AFTER_LOGIN, getSessionUser } from "@/lib/session";

export default async function LoginPage() {
  if (await getSessionUser()) redirect(AFTER_LOGIN);

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <AuthForm loginAction={login} registerAction={register} />
    </main>
  );
}
