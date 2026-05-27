import Link from "next/link";
import { registerBlockRenderer } from "./registry";

/**
 * Embedded poll block.
 *
 * Phase D: renders a placeholder linking to the real poll page. Phase D+:
 * inline the actual <PollCard> here once the renderer is upgraded to
 * support async data loading (which would require the registry to know
 * about promise-returning render functions).
 */
registerBlockRenderer({
  type: "embed-poll",
  label: "📊 嵌入投票",
  render: (data) => {
    const pollId = (data.pollId as string) ?? "";
    if (!pollId) {
      return <p className="text-ink/40 italic text-sm">（沒有指定投票 ID）</p>;
    }
    return (
      <Link
        href={`/app/poll/${pollId}`}
        className="block rounded-soft border border-sage/40 bg-sage-soft/30 p-4 hover:bg-sage-soft/50 transition"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">📊</span>
          <div className="flex-1">
            <div className="text-sm font-medium text-ink">嵌入的投票</div>
            <div className="text-xs text-ink/55">點此跳到投票頁面投票</div>
          </div>
          <span className="text-terracotta text-sm">→</span>
        </div>
      </Link>
    );
  },
});
