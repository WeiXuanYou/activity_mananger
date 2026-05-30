"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Standalone search input. Submits to /app/search?q=… so the URL stays
 * shareable / refreshable. Used both on the search page itself and in
 * the layout header.
 */
export function SearchBar({
  defaultValue = "",
  compact = false,
  placeholder = "搜尋文章、活動、投票、留言...",
}: {
  defaultValue?: string;
  compact?: boolean;
  placeholder?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/app/search?q=${encodeURIComponent(q)}` : "/app/search");
  };

  if (compact) {
    return (
      <form onSubmit={submit} className="relative">
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="搜尋..."
          className="pl-8 pr-3 py-1.5 rounded-soft border border-sand bg-white text-sm w-32 sm:w-48 focus:outline-none focus:border-terracotta focus:w-56 transition-all"
        />
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink/40 text-sm pointer-events-none">🔍</span>
      </form>
    );
  }

  return (
    <form onSubmit={submit} className="relative">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        autoFocus
        className="w-full pl-11 pr-4 py-3 rounded-soft border border-sand bg-white text-base focus:outline-none focus:border-terracotta shadow-card"
      />
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40 text-lg pointer-events-none">🔍</span>
    </form>
  );
}
