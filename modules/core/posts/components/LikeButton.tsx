"use client";
import { useState, useTransition } from "react";
import { toggleLikeAction } from "@/modules/core/posts/actions";

/**
 * Optimistic-UI like button. Initial state (`liked`, `count`) is server-rendered;
 * clicks flip the local state immediately and fire the server action, which
 * persists the toggle and revalidates the feed on its own. Server actions
 * are idempotent at the unique constraint, so a double-click is safe.
 */
export function LikeButton({
  postId,
  initialLiked,
  initialCount,
}: {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    setLiked((l) => !l);
    setCount((c) => (liked ? c - 1 : c + 1));
    startTransition(() => toggleLikeAction(postId));
  };

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className={`flex items-center gap-1.5 transition disabled:opacity-50 ${
        liked ? "text-terracotta" : "text-ink/60 hover:text-terracotta"
      }`}
      aria-pressed={liked}
    >
      <span>{liked ? "❤️" : "🤍"}</span>
      <span>{count}</span>
    </button>
  );
}
