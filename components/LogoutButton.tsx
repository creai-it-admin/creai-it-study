"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export function LogoutButton() {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function logout() {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      await signOut({ redirectTo: "/login" });
    } catch {
      setFailed(true);
      setBusy(false);
    }
  }

  return (
    <span className="flex flex-col items-end gap-1">
      <button type="button" className="btn" disabled={busy} onClick={logout}>
        {busy ? "로그아웃 중" : "로그아웃"}
      </button>
      {failed ? <span role="alert" className="text-[12px] text-[color:var(--warn)]">로그아웃하지 못했습니다. 다시 시도해 주세요.</span> : null}
    </span>
  );
}
