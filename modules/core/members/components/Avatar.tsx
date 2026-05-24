import type { Member } from "../types";

export function Avatar({ member, size = 40 }: { member: Member; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-medium shrink-0 shadow-card"
      style={{
        width: size,
        height: size,
        background: member.avatarColor,
        fontSize: size * 0.42,
      }}
      title={member.name}
    >
      {member.initial}
    </div>
  );
}

export function AvatarStack({
  memberIds,
  members,
  max = 4,
}: {
  memberIds: string[];
  members: Member[];
  max?: number;
}) {
  const shown = memberIds.slice(0, max);
  const rest = memberIds.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((id, i) => {
        const m = members.find((mm) => mm.id === id);
        if (!m) return null;
        return (
          <div key={id} style={{ marginLeft: i === 0 ? 0 : -10 }} className="ring-2 ring-paper rounded-full">
            <Avatar member={m} size={28} />
          </div>
        );
      })}
      {rest > 0 && (
        <div
          className="rounded-full bg-sand text-ink/60 text-xs flex items-center justify-center ring-2 ring-paper"
          style={{ width: 28, height: 28, marginLeft: -10 }}
        >
          +{rest}
        </div>
      )}
    </div>
  );
}
