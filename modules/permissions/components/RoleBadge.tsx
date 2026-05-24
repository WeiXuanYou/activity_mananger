import type { Role } from "@/modules/auth";

const ROLE_STYLE: Record<Role, string> = {
  Guest:  "bg-sand text-ink/70",
  Member: "bg-sage-soft text-sage-dark",
  Editor: "bg-terracotta-soft text-terracotta-dark",
  Admin:  "bg-ink text-white",
};

export function RoleBadge({ role, size = "sm" }: { role: Role; size?: "xs" | "sm" }) {
  const sizeCls = size === "xs" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1";
  return (
    <span className={`inline-block rounded-full font-medium ${ROLE_STYLE[role]} ${sizeCls}`}>
      {role}
    </span>
  );
}
