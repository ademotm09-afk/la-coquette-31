import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "@/components/admin/login-form";

export default async function AdminLoginPage() {
  const session = await auth();
  if (session?.user) redirect("/admin");
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f4eee7] px-4 py-10">
      <div className="absolute -start-24 -top-24 size-80 rounded-full bg-[#d6c0ad]/35 blur-3xl" /><div className="absolute -bottom-20 -end-16 size-72 rounded-full bg-[#b99a82]/20 blur-3xl" />
      <section className="relative w-full max-w-md rounded-[30px] border border-white/80 bg-[#fffdfa]/90 p-6 shadow-[0_30px_90px_rgba(82,54,40,.14)] backdrop-blur-xl sm:p-9">
        <div className="text-center"><p className="font-serif text-4xl font-semibold tracking-tight text-[#442c23]">La Coquette</p><p className="mt-2 text-[9px] font-bold uppercase tracking-[.28em] text-[#9b7b65]">Espace administration</p></div>
        <LoginForm />
      </section>
    </main>
  );
}
