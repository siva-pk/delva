"use client";

import Link from "next/link";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent" }
  | { kind: "error"; message: string };

/**
 * Sign-in is optional and additive. Nothing in Delva requires an account —
 * signing in adds durability and scheduled insights, and that is how this page
 * describes it. No "sign in to continue".
 */
export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  const configured = isSupabaseConfigured();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!configured || state.kind === "sending") return;

    setState({ kind: "sending" });
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setState({ kind: "sent" });
    } catch {
      // Deliberately generic: the underlying message can distinguish a known
      // address from an unknown one.
      setState({
        kind: "error",
        message: "That didn't send. Try again in a moment.",
      });
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-medium">Keep your history</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Delva works without an account. Signing in backs your sessions up and
          lets them follow you between devices.
        </p>

        {!configured ? (
          <p className="mt-8 rounded-lg bg-surface p-4 text-sm text-muted">
            Sign-in isn&rsquo;t configured on this deployment yet. The timer
            works as normal.
          </p>
        ) : state.kind === "sent" ? (
          <p className="mt-8 rounded-lg bg-surface p-4 text-sm text-text">
            Check your email — there&rsquo;s a link waiting. You can close this
            tab.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-8">
            <label htmlFor="email" className="block text-sm text-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-lg bg-surface px-4 py-3 text-base text-text outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
            <button
              type="submit"
              disabled={state.kind === "sending"}
              className="mt-4 w-full rounded-lg bg-accent px-4 py-3 text-base font-medium text-bg focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:bg-muted"
            >
              {state.kind === "sending" ? "Sending…" : "Send me a link"}
            </button>
            {state.kind === "error" ? (
              <p role="alert" className="mt-3 text-sm text-text">
                {state.message}
              </p>
            ) : null}
          </form>
        )}

        <Link
          href="/"
          className="mt-8 inline-block text-sm text-muted underline underline-offset-4"
        >
          Back to the timer
        </Link>
      </div>
    </main>
  );
}
