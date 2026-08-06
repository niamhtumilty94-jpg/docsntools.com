import { CategoryShell } from "@/components/category-shell";
import type { Tool } from "@/lib/tools";

export function ToolPageLayout({ tool, children }: { tool: Tool; children: React.ReactNode }) {
  return <CategoryShell tool={tool}>{children}</CategoryShell>;
}
