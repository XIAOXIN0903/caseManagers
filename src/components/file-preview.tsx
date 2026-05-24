"use client";

import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface PreviewButtonProps {
  url: string;
  fileName: string;
}

export function PreviewButton({ url, fileName }: PreviewButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() => {
        const w = window.open(url, "_blank");
        // For images: show in white-background page for visibility
        if (
          !w &&
          /\.(png|jpe?g|gif|webp|bmp)$/i.test(fileName || url)
        ) {
          // Fallback if popup blocked
          const a = document.createElement("a");
          a.href = url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.click();
        }
      }}
      type="button"
      title="预览"
    >
      <Eye className="h-4 w-4" />
    </Button>
  );
}
