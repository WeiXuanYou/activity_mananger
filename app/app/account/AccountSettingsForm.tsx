"use client";
/**
 * Two independent forms on one page — profile + password.
 *
 * They're rendered as separate <form> elements (and separate server
 * actions) so saving the profile doesn't disturb the password fields
 * and vice versa. Each section shows its own status row inline.
 */
import { useState, useRef, useTransition } from "react";
import {
  updateProfileAction,
  changePasswordAction,
  signOutOtherSessionsAction,
  resendVerificationEmailAction,
} from "@/modules/auth/actions";
import { AVATAR_PALETTE } from "@/modules/auth/validation";
import { fileToCroppedDataUrl } from "@/lib/avatar";

type Initial = {
  name: string;
  handle: string;
  initial: string;
  avatarColor: string;
  avatarImage: string | null;
  email: string | null;
  emailVerified: boolean;
  birthday: string | null;
  hasPassword: boolean;
};

export function AccountSettingsForm({ initial }: { initial: Initial }) {
  return (
    <div className="space-y-6">
      <ProfileSection initial={initial} />
      <PasswordSection hasPassword={initial.hasPassword} />
    </div>
  );
}

// ─── Profile ───────────────────────────────────────────────────────

function ProfileSection({ initial }: { initial: Initial }) {
  const [name, setName] = useState(initial.name);
  const [handle, setHandle] = useState(initial.handle);
  const [initialChar, setInitialChar] = useState(initial.initial);
  const [avatarColor, setAvatarColor] = useState(initial.avatarColor);
  /** Same tri-state contract as SetupForm:
   *  - undefined = don't touch existing avatarImage
   *  - ""        = clear it
   *  - data:…    = upload */
  const [avatarImage, setAvatarImage] = useState<string | undefined>(undefined);
  const [previewImage, setPreviewImage] = useState<string | null>(initial.avatarImage);
  const [email, setEmail] = useState(initial.email ?? "");
  const [birthday, setBirthday] = useState(initial.birthday ?? "");
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const displayInitial = initialChar.trim() || name.trim().slice(0, 1) || "新";

  const onPickFile = async (file: File | null) => {
    setFeedback(null);
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      setFeedback({ kind: "err", msg: "請選擇圖片檔" });
      return;
    }
    try {
      const dataUrl = await fileToCroppedDataUrl(file);
      setAvatarImage(dataUrl);
      setPreviewImage(dataUrl);
    } catch {
      setFeedback({ kind: "err", msg: "讀取圖片失敗，請換一張試試" });
    }
  };

  const clearImage = () => {
    setAvatarImage("");
    setPreviewImage(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = () => {
    setFeedback(null);
    startTransition(async () => {
      const r = await updateProfileAction({
        name,
        handle,
        initial: displayInitial,
        avatarColor,
        avatarImage,
        email,                      // empty string explicitly clears
        birthday: birthday || null,
      });
      if (r.error) setFeedback({ kind: "err", msg: r.error });
      else {
        setFeedback({ kind: "ok", msg: "已儲存 ✓" });
        // Don't auto-clear avatarImage state — server already applied it.
      }
    });
  };

  return (
    <section className="bg-white rounded-soft shadow-card border border-sand/60 p-5 sm:p-6">
      <h2 className="serif text-xl text-ink mb-4">👤 個人檔案</h2>

      <div className="flex items-center gap-4 flex-wrap mb-5">
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
          這是大家會看到的頭像 ↑
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

      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-ink/80">名字</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            className="mt-2 w-full px-4 py-3 rounded-soft border border-sand bg-cream/30 serif text-xl"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink/80">暱稱（網址用 / 登入帳號）</span>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value.toLowerCase())}
            minLength={2}
            maxLength={24}
            pattern="[a-z0-9-]+"
            className="mt-2 w-full px-3 py-2.5 rounded-soft border border-sand bg-cream/30 font-mono text-sm"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink/80 flex items-center gap-2 flex-wrap">
            Email · 必填（用來找回密碼 / 帳號）
            <EmailVerifyBadge
              verified={initial.emailVerified}
              hasEmail={Boolean(initial.email)}
              edited={email !== (initial.email ?? "")}
            />
          </span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            autoComplete="email"
            placeholder="someone@example.com"
            className="mt-2 w-full px-3 py-2.5 rounded-soft border border-sand bg-cream/30 font-mono text-sm"
          />
          <p className="mt-1 text-xs text-ink/50">
            可以換成別的信箱，但不能留空 —— 這是你忘記密碼 / 帳號時唯一的找回管道。
            {!initial.emailVerified && initial.email && (
              <span className="block mt-1">
                改完按「儲存」後我們會自動寄一封確認信。
              </span>
            )}
          </p>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-medium text-ink/80">頭像顯示字</span>
            <input
              value={initialChar}
              onChange={(e) => setInitialChar(e.target.value)}
              maxLength={2}
              className="mt-2 w-32 px-3 py-2.5 rounded-soft border border-sand bg-cream/30 text-center"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink/80">生日（可選）</span>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="mt-2 px-3 py-2.5 rounded-soft border border-sand bg-cream/30 w-full"
            />
          </label>
        </div>

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
          </div>
        </div>
      </div>

      <FeedbackRow feedback={feedback} />

      <div className="mt-4 pt-4 border-t border-sand">
        <button
          type="button"
          onClick={submit}
          disabled={pending || !name.trim() || !handle.trim() || !email.trim()}
          className="px-5 py-2.5 rounded-soft bg-terracotta text-white font-medium shadow-card hover:bg-terracotta-dark transition disabled:opacity-50"
        >
          {pending ? "儲存中..." : "儲存個人檔案"}
        </button>
      </div>
    </section>
  );
}

// ─── Password ──────────────────────────────────────────────────────

function PasswordSection({ hasPassword }: { hasPassword: boolean }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [othersFeedback, setOthersFeedback] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [pendingOthers, startOthers] = useTransition();

  const submit = () => {
    setFeedback(null);
    if (next.length < 8) {
      setFeedback({ kind: "err", msg: "新密碼至少 8 個字" });
      return;
    }
    if (next !== confirm) {
      setFeedback({ kind: "err", msg: "兩次輸入的新密碼不一樣" });
      return;
    }
    startTransition(async () => {
      const r = await changePasswordAction({ currentPassword: current, newPassword: next });
      if (r.error) setFeedback({ kind: "err", msg: r.error });
      else {
        setFeedback({ kind: "ok", msg: "密碼已更新 ✓" });
        setCurrent(""); setNext(""); setConfirm("");
      }
    });
  };

  const signOthersOut = () => {
    setOthersFeedback(null);
    startOthers(async () => {
      await signOutOtherSessionsAction();
      setOthersFeedback("已將其他裝置登出 ✓");
    });
  };

  return (
    <section className="bg-white rounded-soft shadow-card border border-sand/60 p-5 sm:p-6">
      <h2 className="serif text-xl text-ink mb-2">🔑 密碼</h2>
      <p className="text-xs text-ink/55 mb-4 leading-relaxed">
        {hasPassword
          ? "為了安全，更改密碼時要先輸入目前的密碼。"
          : "你目前還沒有設密碼（用邀請碼進來的）。這次設定後就能用『暱稱 + 密碼』在新裝置登入。"}
      </p>

      <div className="space-y-3">
        {hasPassword && (
          <label className="block">
            <span className="text-sm font-medium text-ink/80">目前的密碼</span>
            <input
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              type="password"
              autoComplete="current-password"
              className="mt-2 w-full px-3 py-2.5 rounded-soft border border-sand bg-cream/30 font-mono text-sm"
            />
          </label>
        )}
        <label className="block">
          <span className="text-sm font-medium text-ink/80">新密碼（至少 8 個字）</span>
          <input
            value={next}
            onChange={(e) => setNext(e.target.value)}
            type="password"
            autoComplete="new-password"
            minLength={8}
            className="mt-2 w-full px-3 py-2.5 rounded-soft border border-sand bg-cream/30 font-mono text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink/80">再次輸入新密碼</span>
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            type="password"
            autoComplete="new-password"
            minLength={8}
            className="mt-2 w-full px-3 py-2.5 rounded-soft border border-sand bg-cream/30 font-mono text-sm"
          />
        </label>
      </div>

      <FeedbackRow feedback={feedback} />

      <div className="mt-4 pt-4 border-t border-sand flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={submit}
          disabled={pending || !next || (hasPassword && !current)}
          className="px-5 py-2.5 rounded-soft bg-terracotta text-white font-medium shadow-card hover:bg-terracotta-dark transition disabled:opacity-50"
        >
          {pending ? "更新中..." : hasPassword ? "更新密碼" : "設定密碼"}
        </button>
        {hasPassword && (
          <button
            type="button"
            onClick={signOthersOut}
            disabled={pendingOthers}
            className="text-xs px-3 py-2 rounded-soft bg-white border border-sand text-ink/70 hover:bg-cream/40 disabled:opacity-50"
            title="把所有其他裝置的登入清掉（保留這台）"
          >
            {pendingOthers ? "處理中…" : "🚪 把其他裝置登出"}
          </button>
        )}
        {othersFeedback && <span className="text-xs text-sage-dark">{othersFeedback}</span>}
      </div>
    </section>
  );
}

/**
 * Verification badge next to the Email field. Three states:
 *   - already verified (and the field isn't being edited) → ✓ green pill
 *   - email present but unverified → orange pill + resend button
 *   - editing or no email yet → no badge (we'll send a fresh verification
 *     when they save)
 */
function EmailVerifyBadge({
  verified,
  hasEmail,
  edited,
}: {
  verified: boolean;
  hasEmail: boolean;
  edited: boolean;
}) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // While the user is mid-edit, hide the badge — the value they see
  // doesn't reflect what's on the server. Re-appears after save.
  if (edited || !hasEmail) return null;

  if (verified) {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sage-soft/40 text-sage-dark font-medium">
        ✓ 已驗證
      </span>
    );
  }

  const resend = () => {
    setFeedback(null);
    startTransition(async () => {
      const r = await resendVerificationEmailAction();
      setFeedback(r.error ?? "✓ 驗證信已寄出，請去信箱看");
    });
  };

  return (
    <span className="inline-flex items-center gap-2 flex-wrap">
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-terracotta-soft/40 text-terracotta-dark font-medium">
        ⚠ 尚未驗證
      </span>
      <button
        type="button"
        onClick={resend}
        disabled={pending}
        className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-sand text-ink/65 hover:bg-cream/40 disabled:opacity-50"
      >
        {pending ? "寄送中…" : "重新寄驗證信"}
      </button>
      {feedback && <span className="text-[11px] text-ink/60">{feedback}</span>}
    </span>
  );
}

function FeedbackRow({ feedback }: { feedback: { kind: "ok" | "err"; msg: string } | null }) {
  if (!feedback) return null;
  return (
    <p
      className={`mt-3 text-xs rounded-soft px-3 py-2 ${
        feedback.kind === "ok"
          ? "bg-sage-soft/40 border border-sage/30 text-sage-dark"
          : "bg-terracotta-soft/40 border border-terracotta/30 text-terracotta-dark"
      }`}
    >
      {feedback.kind === "ok" ? "✓ " : "⚠ "}
      {feedback.msg}
    </p>
  );
}
