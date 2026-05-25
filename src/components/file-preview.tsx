"use client";

import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface PreviewButtonProps {
  url: string;
  fileName: string;
}

function isPreviewable(fileName: string) {
  return /\.(pdf|png|jpe?g|gif|webp|bmp)$/i.test(fileName);
}

export function PreviewButton({ url, fileName }: PreviewButtonProps) {
  function handlePreview() {
    if (isPreviewable(fileName)) {
      window.open(`/api/download?file=${encodeURIComponent(url)}&name=${encodeURIComponent(fileName)}&inline=1`, "_blank");
    } else {
      window.open(`/api/download?file=${encodeURIComponent(url)}&name=${encodeURIComponent(fileName)}`, "_blank");
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={handlePreview}
      type="button"
      title="预览"
    >
      <Eye className="h-4 w-4" />
    </Button>
  );
}
