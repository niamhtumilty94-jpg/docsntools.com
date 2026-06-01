import { lazy, type ComponentType } from "react";

// Each tool is code-split. Implemented tools are registered here; the rest
// fall back to the placeholder.
export const TOOL_COMPONENTS: Record<string, ComponentType> = {
  // PDF
  "merge-pdf": lazy(() => import("./pdf/merge-pdf")),
  "split-pdf": lazy(() => import("./pdf/split-pdf")),
  "reorder-pdf": lazy(() => import("./pdf/reorder-pdf")),
  "rotate-pdf": lazy(() => import("./pdf/rotate-pdf")),
  "pdf-to-images": lazy(() => import("./pdf/pdf-to-images")),
  "images-to-pdf": lazy(() => import("./pdf/images-to-pdf")),
  "page-numbers": lazy(() => import("./pdf/page-numbers")),
  "watermark-pdf": lazy(() => import("./pdf/watermark-pdf")),
  "extract-text": lazy(() => import("./pdf/extract-text")),
  "compress-pdf": lazy(() => import("./pdf/compress-pdf")),
  // Dev
  "json-formatter": lazy(() => import("./dev/json-formatter")),
  "jwt-decoder": lazy(() => import("./dev/jwt-decoder")),
  "base64": lazy(() => import("./dev/base64")),
  "url-encoder": lazy(() => import("./dev/url-encoder")),
  "hash-generator": lazy(() => import("./dev/hash-generator")),
  "uuid-generator": lazy(() => import("./dev/uuid-generator")),
  "regex-tester": lazy(() => import("./dev/regex-tester")),
  "color-converter": lazy(() => import("./dev/color-converter")),
  "robots-tester": lazy(() => import("./dev/robots-tester")),
  // Utilities
  "qr-code": lazy(() => import("./utilities/qr-code")),
  "password-generator": lazy(() => import("./utilities/password-generator")),
  "unit-converter": lazy(() => import("./utilities/unit-converter")),
  "timestamp": lazy(() => import("./utilities/timestamp")),
  // Text
  "case-converter": lazy(() => import("./text/case-converter")),
  "word-counter": lazy(() => import("./text/word-counter")),
  "find-replace": lazy(() => import("./text/find-replace")),
  "lorem-ipsum": lazy(() => import("./text/lorem-ipsum")),
  "text-diff": lazy(() => import("./text/diff")),
  "remove-duplicates": lazy(() => import("./text/dedupe-sort")),
  // Converters (categorised under "text" in tools.ts)
  "markdown-html": lazy(() => import("./converters/markdown-html")),
  "csv-json": lazy(() => import("./converters/csv-json")),
  "yaml-json": lazy(() => import("./converters/yaml-json")),
  "svg-optimizer": lazy(() => import("./converters/svg-optimizer")),
  // Image
  "compress-image": lazy(() => import("./image/compress-image")),
  "resize-image": lazy(() => import("./image/resize-image")),
  "crop-image": lazy(() => import("./image/crop-image")),
  "convert-image": lazy(() => import("./image/convert-image")),
  "image-base64": lazy(() => import("./image/image-base64")),
  "bulk-zip": lazy(() => import("./image/bulk-zip")),
};
