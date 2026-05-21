"use client";

import { useState } from "react";
import { LineAddFriendModal } from "./line-add-friend-modal";

interface Props {
  addFriendUrl: string | null;
}

export function LineInviteButton({ addFriendUrl }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
        style={{ background: "rgba(217,119,87,0.12)", color: "var(--terra)" }}
      >
        📱 LINE 連携を依頼
      </button>
      {open && (
        <LineAddFriendModal
          addFriendUrl={addFriendUrl}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
