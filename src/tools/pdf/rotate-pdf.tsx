import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { PdfDropArea } from "@/components/tool/pdf-drop-area";
import { PdfPageGrid, type GridPage } from "@/components/tool/pdf-page-grid";
import { SampleDataButton } from "@/components/tool/sample-data-button";
import { Button } from "@/components/ui/button";
import { usePdfDocument } from "@/hooks/use-pdf-document";
import { samplePdfFile } from "@/lib/pdf-sample";
import { ToolToaster } from "@/tools/_shared/toaster";
import { downloadBlob } from "@/tools/_shared/utils";

export default function RotatePdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<GridPage[]>([]);
  const [busy, setBusy] = useState(false);
  const { pages: loaded, loading } = usePdfDocument(file);

  useEffect(() => {
    setPages(
      loaded.map((p) => ({
        id: `p-${p.index}`,
        origIndex: p.index,
        thumb: p.thumb,
        rotation: 0,
      })),
    );
  }, [loaded]);

  const rotateOne = (id: string) =>
    setPages((cur) =>
      cur.map((p) => (p.id === id ? { ...p, rotation: ((p.rotation ?? 0) + 90) % 360 } : p)),
    );
  const rotateAll = (deg: number) =>
    setPages((cur) => cur.map((p) => ({ ...p, rotation: ((p.rotation ?? 0) + deg) % 360 })));

  const save = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const { PDFDocument, degrees } = await import("pdf-lib");
      const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const docPages = src.getPages();
      pages.forEach((p) => {
        const extra = p.rotation ?? 0;
        if (extra) {
          const cur = docPages[p.origIndex].getRotation().angle;
          docPages[p.origIndex].setRotation(degrees((cur + extra) % 360));
        }
      });
      const bytes = await src.save();
      downloadBlob(
        new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }),
        file.name.replace(/\.pdf$/i, "") + "-rotated.pdf",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <ToolToaster />
      <div className="flex justify-end">
        <SampleDataButton onLoad={async () => setFile(await samplePdfFile())} />
      </div>
      <PdfDropArea file={file} onFile={setFile} pageCount={pages.length || undefined} />
      {file && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              Click rotate icon on a page, or apply to all
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => rotateAll(90)}>
                Rotate all 90°
              </Button>
              <Button size="sm" variant="outline" onClick={() => rotateAll(180)}>
                Rotate all 180°
              </Button>
              <Button size="sm" onClick={save} disabled={busy || pages.length === 0}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Save PDF
              </Button>
            </div>
          </div>
          {loading && pages.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Rendering…
            </div>
          ) : (
            <PdfPageGrid pages={pages} onRotate={rotateOne} readOnly />
          )}
        </>
      )}
    </div>
  );
}
