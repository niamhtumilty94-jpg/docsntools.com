import { Wrench } from "lucide-react";

export default function Placeholder() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <Wrench className="h-8 w-8 text-muted-foreground" />
      <div className="text-sm font-medium">This tool is coming soon</div>
      <div className="max-w-md text-xs text-muted-foreground">
        We're building this out. In the meantime, browse the other tools - they all run completely
        in your browser.
      </div>
    </div>
  );
}
