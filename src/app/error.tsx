"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">出错了</h1>
        <p className="text-muted-foreground">
          页面加载失败，请刷新后重试。
        </p>
        <Button onClick={reset}>重新加载</Button>
      </div>
    </div>
  );
}
