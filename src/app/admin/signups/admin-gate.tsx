"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "admin_authenticated";
const CORRECT = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "";

interface Props {
  children: React.ReactNode;
}

export default function AdminGate({ children }: Props) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    setAuthed(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (input === CORRECT) {
      localStorage.setItem(STORAGE_KEY, "true");
      setAuthed(true);
    } else {
      setError(true);
    }
  }

  function handleLogout() {
    localStorage.removeItem(STORAGE_KEY);
    setAuthed(false);
    setInput("");
  }

  if (authed === null) return null;

  if (!authed) {
    return (
      <div style={{ background: "var(--paper)", minHeight: "100vh" }} className="flex items-center justify-center">
        <div className="card p-10 w-full max-w-sm text-center">
          <div className="font-display text-2xl font-semibold mb-1">Pochinote Admin</div>
          <p className="text-sm mb-8" style={{ color: "var(--ink-soft)" }}>パスワードを入力してください</p>
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <input
              type="password"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(false); }}
              placeholder="パスワード"
              className="px-4 py-3 rounded-lg border text-sm outline-none"
              style={{ borderColor: error ? "#c0392b" : "rgba(26,26,46,0.15)", background: "white" }}
              autoFocus
            />
            {error && <p className="text-xs" style={{ color: "#c0392b" }}>パスワードが違います</p>}
            <button
              type="submit"
              className="px-5 py-3 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: "var(--terra)", color: "white" }}
            >
              ログイン
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <LogoutContext.Provider value={handleLogout}>
      {children}
    </LogoutContext.Provider>
  );
}

import { createContext, useContext } from "react";
export const LogoutContext = createContext<() => void>(() => {});
export function useLogout() { return useContext(LogoutContext); }
