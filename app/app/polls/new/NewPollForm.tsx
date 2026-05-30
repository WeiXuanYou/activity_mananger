"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/modules/core/categories";
import { COLOR_CLASSES } from "@/modules/core/categories";
import { createPollAction } from "@/modules/core/polls/actions";

type Deadline = "1d" | "3d" | "1w" | "2w" | "custom";

function deadlineToIso(d: Deadline, custom: string): string | undefined {
  if (d === "custom") return custom || undefined;
  const days = { "1d": 1, "3d": 3, "1w": 7, "2w": 14 }[d];
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(23, 59, 0, 0);
  return date.toISOString();
}

export function NewPollForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [multiSelect, setMultiSelect] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [allowAdd, setAllowAdd] = useState(true);
  const [deadline, setDeadline] = useState<Deadline>("3d");
  const [customDeadline, setCustomDeadline] = useState("");
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggleCat = (slug: string) => {
    setSelectedSlugs((cur) =>
      cur.includes(slug) ? cur.filter((s) => s !== slug) : cur.length >= 2 ? cur : [...cur, slug],
    );
  };

  const submit = () => {
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim()) return setError("請填投票問題");
    if (cleanOptions.length < 2) return setError("至少需要 2 個選項");
    setError(null);
    startTransition(async () => {
      try {
        await createPollAction({
          question: question.trim(),
          options: cleanOptions,
          multiSelect,
          anonymous,
          allowAddOption: allowAdd,
          closesAt: deadlineToIso(deadline, customDeadline),
          categorySlugs: selectedSlugs,
        });
        router.push("/app/feed");
      } catch (e) {
        setError(e instanceof Error ? e.message : "建立失敗");
      }
    });
  };

  return (
    <div className="bg-white rounded-soft shadow-card border border-sand/60 p-6 space-y-4">
      <div className="bg-gradient-to-r from-sage-soft/40 to-cream rounded-soft border border-sage/20 p-3 text-xs text-ink/65 flex items-start gap-2">
        <span className="text-lg">📊</span>
        <span>類似 Line 的投票工具——支援單選/多選、匿名、可由家人朋友新增選項、自動截止。</span>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-ink/80">問題</span>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="想問家人朋友什麼？（例：下次聚餐吃什麼？）"
          required
          className="mt-2 w-full px-4 py-3 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta serif text-xl"
        />
      </label>

      <div>
        <span className="text-sm font-medium text-ink/80 mb-2 block">選項</span>
        <div className="space-y-2">
          {options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-ink/40 text-sm w-5">{i + 1}.</span>
              <input
                value={o}
                onChange={(e) =>
                  setOptions(options.map((x, j) => (j === i ? e.target.value : x)))
                }
                placeholder={`選項 ${i + 1}`}
                className="flex-1 px-4 py-2.5 rounded-soft border border-sand bg-cream/30 focus:outline-none focus:border-terracotta"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => setOptions(options.filter((_, j) => j !== i))}
                  className="text-ink/40 hover:text-terracotta text-sm w-7"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setOptions([...options, ""])}
            className="text-sm text-terracotta hover:underline ml-7"
          >
            ＋ 新增選項
          </button>
        </div>
      </div>

      <div>
        <span className="text-sm font-medium text-ink/80 block mb-2">⏰ 截止時間</span>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["1d", "1 天後"],
              ["3d", "3 天後"],
              ["1w", "1 週後"],
              ["2w", "2 週後"],
              ["custom", "自訂"],
            ] as [Deadline, string][]
          ).map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => setDeadline(k)}
              className={`px-3 py-1.5 rounded-full text-sm transition ${
                deadline === k
                  ? "bg-terracotta text-white shadow-card"
                  : "bg-cream/50 text-ink/70 hover:bg-cream"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        {deadline === "custom" && (
          <input
            type="datetime-local"
            value={customDeadline}
            onChange={(e) => setCustomDeadline(e.target.value)}
            className="mt-2 px-3 py-2 rounded-soft border border-sand bg-cream/30 text-sm"
          />
        )}
      </div>

      {/* Categories */}
      <div className="pt-2 border-t border-sand">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-ink/80">🏷 分類（最多 2 個）</span>
          <span className="text-xs text-ink/40">已選 {selectedSlugs.length} / 2</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => {
            const c = COLOR_CLASSES[cat.color];
            const isSel = selectedSlugs.includes(cat.slug);
            const disabled = !isSel && selectedSlugs.length >= 2;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCat(cat.slug)}
                disabled={disabled}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm border transition ${
                  isSel
                    ? `${c.bg} text-white border-transparent shadow-card`
                    : disabled
                    ? "bg-cream/40 text-ink/30 border-sand cursor-not-allowed"
                    : `bg-white text-ink/70 border-sand hover:${c.bgSoft} hover:${c.text}`
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1 pt-2 border-t border-sand">
        <ToggleRow label="允許多選" desc="家人朋友可勾選多個選項" on={multiSelect} onChange={setMultiSelect} />
        <ToggleRow label="🕶 匿名投票" desc="不公開誰投了什麼" on={anonymous} onChange={setAnonymous} />
        <ToggleRow label="允許新增選項" desc="家人朋友可補上沒想到的選項" on={allowAdd} onChange={setAllowAdd} />
      </div>

      {error && (
        <p className="text-xs text-terracotta-dark bg-terracotta-soft/40 border border-terracotta/30 rounded-soft px-3 py-2">
          ⚠ {error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-3 border-t border-sand">
        <button
          onClick={submit}
          disabled={pending}
          className="px-5 py-2.5 rounded-soft bg-terracotta text-white font-medium shadow-card hover:bg-terracotta-dark transition disabled:opacity-50"
        >
          {pending ? "建立中..." : "發起投票"}
        </button>
        <span className="ml-auto text-xs text-ink/40">建立後跳到動態</span>
      </div>
    </div>
  );
}

function ToggleRow({
  label, desc, on, onChange,
}: { label: string; desc: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 py-2 cursor-pointer">
      <div className="flex-1">
        <div className="text-sm text-ink font-medium">{label}</div>
        <div className="text-xs text-ink/50">{desc}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!on)}
        className={`w-10 h-6 rounded-full transition relative ${on ? "bg-terracotta" : "bg-sand"}`}
        aria-pressed={on}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
            on ? "left-[18px]" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}
