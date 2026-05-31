import Link from "next/link";
import { requireCurrentUser } from "@/modules/auth";
import { db } from "@/lib/db";
import { AccountSettingsForm } from "./AccountSettingsForm";

/**
 * /app/account — self-service profile + password settings.
 *
 * Separate from /app/setup intentionally:
 *   - setup is the one-time gate that runs before the feed becomes
 *     reachable. It's all-or-nothing.
 *   - account is everyday self-service: change a single field, hit
 *     save, stay on the page.
 *
 * Pure server component — reads the user, hands a snapshot to the
 * client form. Mutations go through server actions in
 * `modules/auth/actions.ts` and revalidate this path.
 */
export const metadata = { title: "相聚 · 帳戶設定" };

export default async function AccountSettingsPage() {
  const me = await requireCurrentUser();
  // Pull the few fields the form needs in a single query so we don't
  // ship the entire session shape (which includes the role+perms join)
  // down to the client bundle.
  const user = await db.user.findUniqueOrThrow({
    where: { id: me.id },
    select: {
      id: true, name: true, handle: true, initial: true,
      avatarColor: true, avatarImage: true, email: true,
      emailVerifiedAt: true,
      birthday: true, passwordHash: true,
    },
  });

  return (
    <main className="max-w-2xl mx-auto px-3 sm:px-5 py-5 sm:py-8">
      <Link
        href={`/app/members/${user.id}`}
        className="text-sm text-ink/60 hover:text-terracotta mb-4 inline-block"
      >
        ← 回我的個人檔案
      </Link>
      <div className="mb-6">
        <p className="text-sage-dark text-xs font-medium tracking-widest mb-1">ACCOUNT · SETTINGS</p>
        <h1 className="serif text-3xl text-ink">帳戶設定</h1>
        <p className="text-ink/60 text-sm mt-1">
          這裡可以更改你的頭像、名字、聯絡 Email、密碼。改完不用重新登入。
        </p>
      </div>

      <AccountSettingsForm
        initial={{
          name: user.name,
          handle: user.handle,
          initial: user.initial,
          avatarColor: user.avatarColor,
          avatarImage: user.avatarImage,
          email: user.email,
          emailVerified: Boolean(user.emailVerifiedAt),
          birthday: user.birthday ? user.birthday.toISOString().slice(0, 10) : null,
          hasPassword: Boolean(user.passwordHash),
        }}
      />
    </main>
  );
}
