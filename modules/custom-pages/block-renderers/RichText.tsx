import { registerBlockRenderer } from "./registry";

registerBlockRenderer({
  type: "richtext",
  label: "📝 Rich Text",
  render: (data) => (
    <div className="prose prose-sm max-w-none text-ink/80 leading-relaxed">
      {(data.html as string) ?? "(empty)"}
    </div>
  ),
});
