"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@lacoquette.dz");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-9 space-y-4">
      <label className="block"><span className="mb-2 block text-[11px] font-bold uppercase tracking-[.12em] text-[#80695c]">Email</span><span className="relative block"><Mail size={17} className="absolute start-4 top-1/2 -translate-y-1/2 text-[#947c6d]" /><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="username" required className="h-14 w-full rounded-2xl border border-[#dfd2c7] bg-white pe-4 ps-11 text-[16px] outline-none transition focus:border-[#7b5a46] focus:ring-4 focus:ring-[#7b5a46]/10" /></span></label>
      <label className="block"><span className="mb-2 block text-[11px] font-bold uppercase tracking-[.12em] text-[#80695c]">Mot de passe</span><span className="relative block"><LockKeyhole size={17} className="absolute start-4 top-1/2 -translate-y-1/2 text-[#947c6d]" /><input value={password} onChange={(e) => setPassword(e.target.value)} type={show ? "text" : "password"} autoComplete="current-password" required className="h-14 w-full rounded-2xl border border-[#dfd2c7] bg-white pe-12 ps-11 text-[16px] outline-none transition focus:border-[#7b5a46] focus:ring-4 focus:ring-[#7b5a46]/10" /><button type="button" onClick={() => setShow(!show)} aria-label="Afficher le mot de passe" className="absolute end-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center text-[#806a5d]">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
      {error && <p role="alert" className="rounded-xl bg-[#fff0eb] px-4 py-3 text-xs font-medium text-[#9b503b]">{error}</p>}
      <button disabled={loading} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#65442f] to-[#846047] text-sm font-bold text-white shadow-[0_14px_28px_rgba(91,59,42,.2)] disabled:opacity-60">{loading && <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}{loading ? "Connexion…" : "Accéder au dashboard"}</button>
      <p className="pt-2 text-center text-[10px] leading-5 text-[#9b897e]">Accès réservé à l&apos;équipe La Coquette.</p>
    </form>
  );
}
