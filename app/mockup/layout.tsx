import { AssistantFab } from "@/modules/ai-assistant";
import { MockBottomNav } from "./_layout/MockBottomNav";

export default function MockupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="pb-16 md:pb-0">{children}</div>
      <AssistantFab />
      <MockBottomNav />
    </>
  );
}
