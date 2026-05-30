"use client";
import { useState, useTransition } from "react";
import { completeSetupAction } from "@/modules/auth/actions";

/** Built-in palette — matches the avatar colors used by the seed.
 *  Users can also paste any hex into the input below, but the swatches
 *  are the friendly defaults. */
const PALETTE = [
  "#C75B3A", "#7A8E6E", "#D4A574", "#8FA7B7",
  "#B58FBF", "#D98090", "#7AA68F", "#E5994A",
  "#5B7B9F", "#8E6A3D",
];

export function SetupForm({
  initial,
}: {
  initial: {
    name: string;
    handle: string;
    initial: string;
    avatarColor: string;
    birthday: string | null;
  };
}) {
  const [name, setName] = useState(initial.name);
  const [handle, setHandle] = useState(initial.handle);
  const [initialChar, setInitialChar] = useState(initial.initial);
  const [avatarColor, setAvatarColor] = useState(initial.avatarColor);
  const [birthday, setBirthday] = useState(initial.birthday ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Default the avatar letter to the first non-space char of the name
  // when the user hasn't picked one yet. Keeps the preview lively.
  const displayInitial = initialChar.trim() || name.trim().slice(0, 1) || "新";

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const r = await completeSetupAction({
        name,
        handle,
        initial: displayInitial,
        avatarColor,
        birthday: birthday || null,
      });
      // Action will redirect on success — so we only see a return value on
      // error. (Redirect throws a special NextRedirect that won't reach
      // here as a normal value.)
      if (r?.error) setError(r.error);
    });
  };

  return (
    <div className="bg-white rounded-soft shadow-card border border-sand/60 p-5 sm:p-6 space-y-5">
      {/* Live avatar preview */}
      <div className="flex items-center gap-4">
        <div
          className="w-20 h-20 rounded-full text-white text-3xl font-medium flex items-center justify-center shadow-card shrink-0"
          style={{ background: avatarColor }}
        >
          {displayInitial}
        </div>
        <div className="text-sm text-ink/55 flex-1 min-w-0">
          這是大家會看到的頭像 ↑<br />
          <span className="text-xs text-ink/40">會顯示在你發的每則內容旁邊</span>
        </div>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-ink/80">名字</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：阿嬤、小明、Andy"
          required
          maxLength={40}
          className="mt-2 w-full px-4 py-3 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta serif text-xl"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-ink/80">handle（網址用，限英數和 -）</span>
        <input
          value={handle}
          onChange={(e) => setHandle(e.target.value.toLowerCase())}
          placeholder="grandma"
          required
          minLength={2}
          maxLength={24}
          pattern="[a-z0-9-]+"
          className="mt-2 w-full px-3 py-2.5 rounded-soft border border-sand bg-cream/30 font-mono text-sm"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-ink/80">頭像顯示字（1-2 個字最好看）</span>
        <input
          value={initialChar}
          onChange={(e) => setInitialChar(e.target.value)}
          placeholder="自動帶名字的第一個字"
          maxLength={2}
          className="mt-2 w-32 px-3 py-2.5 rounded-soft border border-sand bg-cream/30 text-center"
        />
      </label>

      <div>
        <span className="text-sm font-medium text-ink/80 block mb-2">頭像顏色</span>
        <div className="flex flex-wrap gap-2 items-center">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setAvatarColor(c)}
              className={`w-9 h-9 rounded-full border-2 transition ${
                avatarColor.toLowerCase() === c.toLowerCase()
                  ? "border-ink shadow-card scale-110"
                  : "border-transparent hover:scale-105"
              }`}
              style={{ background: c }}
              aria-label={`avatar color ${c}`}
            />
          ))}
          <input
            type="text"
            value={avatarColor}
            onChange={(e) => setAvatarColor(e.target.value)}
            className="ml-2 w-28 px-2 py-1.5 rounded-soft border border-sand bg-cream/30 font-mono text-xs"
          />
        </div>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-ink/80">生日（可選 · 讓家人朋友記得幫你慶祝 🎂）</span>
        <input
          type="date"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          className="mt-2 px-3 py-2.5 rounded-soft border border-sand bg-cream/30"
        />
      </label>

      {error && (
        <p className="text-xs text-terracotta-dark bg-terracotta-soft/40 border border-terracotta/30 rounded-soft px-3 py-2">
          ⚠ {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={pending || !name.trim() || !handle.trim()}
        className="w-full sm:w-auto px-6 py-3 rounded-soft bg-terracotta text-white font-medium shadow-card hover:bg-terracotta-dark transition disabled:opacity-50"
      >
        {pending ? "儲存中..." : "完成設定，進入相聚 →"}
      </button>
    </div>
  );
}
