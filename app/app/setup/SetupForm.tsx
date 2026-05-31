"use client";
import { useState, useTransition, useRef } from "react";
import { completeSetupAction } from "@/modules/auth/actions";
import { AVATAR_PALETTE } from "@/modules/auth/validation";
import { fileToCroppedDataUrl } from "@/lib/avatar";

export function SetupForm({
  initial,
  mustResetPassword = false,
}: {
  initial: {
    name: string;
    handle: string;
    initial: string;
    avatarColor: string;
    avatarImage?: string | null;
    email?: string | null;
    birthday: string | null;
  };
  /** If true, the password field is required and the explanation banner
   *  swaps to "the default admin/admin password must be replaced". Used
   *  for the bootstrap admin's first login. */
  mustResetPassword?: boolean;
}) {
  const [name, setName] = useState(initial.name);
  const [handle, setHandle] = useState(initial.handle);
  const [initialChar, setInitialChar] = useState(initial.initial);
  const [avatarColor, setAvatarColor] = useState(initial.avatarColor);
  /** `undefined` = keep existing (don't send the field).
   *  `""` = explicitly clear (revert to initial+color circle).
   *  data:image/...;base64,... = new upload. */
  const [avatarImage, setAvatarImage] = useState<string | undefined>(undefined);
  const [previewImage, setPreviewImage] = useState<string | null>(initial.avatarImage ?? null);
  const [email, setEmail] = useState(initial.email ?? "");
  const [birthday, setBirthday] = useState(initial.birthday ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  // Default the avatar letter to the first non-space char of the name
  // when the user hasn't picked one yet. Keeps the preview lively.
  const displayInitial = initialChar.trim() || name.trim().slice(0, 1) || "新";

  const onPickFile = async (file: File | null) => {
    setError(null);
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      setError("請選擇圖片檔");
      return;
    }
    try {
      const dataUrl = await fileToCroppedDataUrl(file);
      setAvatarImage(dataUrl);
      setPreviewImage(dataUrl);
    } catch {
      setError("讀取圖片失敗，請換一張試試");
    }
  };

  const clearImage = () => {
    setAvatarImage("");      // signal: clear in DB
    setPreviewImage(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const r = await completeSetupAction({
        name,
        handle,
        initial: displayInitial,
        avatarColor,
        avatarImage,
        email,                       // empty string = no email
        birthday: birthday || null,
        password: password || undefined,
        mustResetPassword,
      });
      // Action will redirect on success — so we only see a return value on
      // error. (Redirect throws a special NextRedirect that won't reach
      // here as a normal value.)
      if (r?.error) setError(r.error);
    });
  };

  return (
    <div className="bg-white rounded-soft shadow-card border border-sand/60 p-5 sm:p-6 space-y-5">
      {/* Live avatar preview + upload */}
      <div className="flex items-center gap-4 flex-wrap">
        {previewImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewImage}
            alt="avatar preview"
            className="w-20 h-20 rounded-full object-cover shadow-card shrink-0"
          />
        ) : (
          <div
            className="w-20 h-20 rounded-full text-white text-3xl font-medium flex items-center justify-center shadow-card shrink-0"
            style={{ background: avatarColor }}
          >
            {displayInitial}
          </div>
        )}
        <div className="text-sm text-ink/55 flex-1 min-w-0">
          這是大家會看到的頭像 ↑<br />
          <span className="text-xs text-ink/40">會顯示在你發的每則內容旁邊</span>
          <div className="mt-2 flex gap-2 flex-wrap">
            <label className="text-xs px-3 py-1.5 rounded-soft bg-cream border border-sand text-ink/75 hover:bg-cream/60 cursor-pointer">
              📷 上傳圖片
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {previewImage && (
              <button
                type="button"
                onClick={clearImage}
                className="text-xs px-3 py-1.5 rounded-soft bg-white border border-sand text-ink/65 hover:bg-cream/40"
              >
                改回字母頭像
              </button>
            )}
          </div>
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
        <span className="text-sm font-medium text-ink/80">暱稱（網址用，限英數和 -）</span>
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
          {AVATAR_PALETTE.map((c) => (
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
        <span className="text-sm font-medium text-ink/80">Email · 必填</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="someone@example.com"
          className="mt-2 w-full px-3 py-2.5 rounded-soft border border-sand bg-cream/30 font-mono text-sm"
        />
        <p className="mt-1 text-xs text-ink/50">
          忘記密碼或帳號時，就是靠這個 Email 把你找回來，請填一個能收信的信箱。
        </p>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-ink/80">生日（可選 · 讓家人朋友記得幫你慶祝 🎂）</span>
        <input
          type="date"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          className="mt-2 px-3 py-2.5 rounded-soft border border-sand bg-cream/30"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-ink/80">
          {mustResetPassword ? "新密碼（必填，至少 8 個字）" : "密碼（可選）"}
        </span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required={mustResetPassword}
          minLength={mustResetPassword ? 8 : 0}
          autoComplete="new-password"
          placeholder={mustResetPassword
            ? "至少 8 個字，請選一個記得住又難猜的"
            : "之後用 handle + 密碼登入回來（不填也可以，先用 session）"}
          className="mt-2 w-full px-3 py-2.5 rounded-soft border border-sand bg-cream/30 font-mono text-sm"
        />
        {mustResetPassword && (
          <p className="mt-1 text-xs text-terracotta-dark">
            ⚠ 你目前用的是預設密碼。為了安全，請先換一個再進入系統。
          </p>
        )}
      </label>

      {error && (
        <p className="text-xs text-terracotta-dark bg-terracotta-soft/40 border border-terracotta/30 rounded-soft px-3 py-2">
          ⚠ {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={pending || !name.trim() || !handle.trim() || !email.trim()}
        className="w-full sm:w-auto px-6 py-3 rounded-soft bg-terracotta text-white font-medium shadow-card hover:bg-terracotta-dark transition disabled:opacity-50"
      >
        {pending ? "儲存中..." : "完成設定，進入相聚 →"}
      </button>
    </div>
  );
}
