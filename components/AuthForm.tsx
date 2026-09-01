"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { Icon, ErrorNote } from "@/components/ui";
import type { ActionResult } from "@/lib/actions";

type Action = (prev: unknown, formData: FormData) => Promise<ActionResult>;

/** Seeded by prisma/seed.ts. Keep in step with DEMO_CALLSIGNS/DEMO_PASSWORD. */
const DEMO = { email: "recon01@pmgo.local", password: "tactical123" };

function SubmitButton({ label, icon }: { label: string; icon: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary font-headline flex w-full items-center justify-center gap-2 py-3.5 text-sm font-bold tracking-widest uppercase"
    >
      <Icon name={icon} className="text-lg" />
      {pending ? "STAND BY…" : label}
    </button>
  );
}

export default function AuthForm({
  loginAction,
  registerAction,
}: {
  loginAction: Action;
  registerAction: Action;
}) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // A successful action redirects, so state only ever holds a failure.
  const [loginState, runLogin] = useActionState<ActionResult | null, FormData>(
    async (prev, fd) => loginAction(prev, fd),
    null,
  );
  const [registerState, runRegister] = useActionState<ActionResult | null, FormData>(
    async (prev, fd) => registerAction(prev, fd),
    null,
  );

  const state = tab === "login" ? loginState : registerState;
  const error = state && "error" in state ? state.error : null;

  const field =
    "w-full border border-outline-variant bg-[#0E0E0F] px-4 py-3 font-body text-sm text-on-surface transition-colors focus:border-primary focus:outline-none";
  const labelCls =
    "font-label mb-2 block text-xs font-bold tracking-wider text-outline uppercase";

  return (
    <div className="hud-card relative w-full max-w-md overflow-hidden border border-outline-variant bg-[#1A1A1C] p-8 md:p-10">
      <div className="absolute top-0 right-0 left-0 h-1 bg-primary shadow-[0_0_15px_rgba(255,107,0,0.6)]" />

      <div className="mb-8 text-center">
        <div className="mb-3 inline-flex h-14 w-14 items-center justify-center border border-primary/40 bg-primary/10 text-primary">
          <Icon name="sports_esports" className="text-3xl" />
        </div>
        <h1 className="font-headline text-3xl font-bold tracking-tighter text-on-surface uppercase">
          TACTICAL PROTOCOL
        </h1>
        <p className="font-label mt-1 text-xs tracking-widest text-outline uppercase">
          PMGO COMPETITIVE INTEL PORTAL
        </p>
      </div>

      <div className="mb-6 flex border-b border-outline-variant">
        {(
          [
            ["login", "AUTHENTICATE"],
            ["register", "REGISTER"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTab(key);
              setEmail("");
              setPassword("");
            }}
            className={`font-headline flex-1 border-b-2 py-3 text-sm font-bold tracking-wider uppercase transition-colors ${
              tab === key
                ? "border-primary text-primary"
                : "border-transparent text-outline hover:text-on-surface"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form
        key={tab}
        action={tab === "login" ? runLogin : runRegister}
        className="flex flex-col gap-5"
      >
        {/* The callsign is the display name on both leaderboards, so it is
            collected once at registration rather than derived from the address. */}
        {tab === "register" && (
          <div>
            <label className={labelCls} htmlFor="name">
              OPERATIVE CALLSIGN
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              minLength={2}
              autoComplete="nickname"
              placeholder="Enter callsign…"
              className={field}
            />
          </div>
        )}

        <div>
          <label className={labelCls} htmlFor="email">
            OPERATIVE EMAIL
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="operative@pmgo.local"
            className={field}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="password">
            SECURITY CLEARANCE KEY
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={4}
            autoComplete={tab === "login" ? "current-password" : "new-password"}
            placeholder="••••••••"
            className={field}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <ErrorNote>{error}</ErrorNote>

        {tab === "login" ? (
          <SubmitButton label="AUTHENTICATE" icon="vpn_key" />
        ) : (
          <SubmitButton label="REGISTER OPERATIVE" icon="person_add" />
        )}
      </form>

      {tab === "login" && (
        <div className="mt-6 border-t border-outline-variant pt-5 text-center">
          <button
            type="button"
            onClick={() => {
              setEmail(DEMO.email);
              setPassword(DEMO.password);
            }}
            className="btn-ghost font-headline inline-flex items-center gap-2 px-4 py-2 text-[11px] font-bold tracking-wider uppercase"
          >
            <Icon name="bolt" className="text-sm" /> USE DEMO ACCESS
          </button>
          <p className="font-label mt-2.5 text-[10px] text-outline">
            <span className="text-primary">{DEMO.email}</span> / {DEMO.password}
          </p>
        </div>
      )}
    </div>
  );
}
