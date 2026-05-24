"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const IDLE_TIMEOUT = 10 * 60 * 1000;
const WARNING_BEFORE = 60 * 1000;

export default function SessionTimeout() {
  const router = useRouter();

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let warningTimer: ReturnType<typeof setTimeout> | null = null;
    let warned = false;

    function doLogout() {
      fetch("/api/logout", { method: "POST" }).then(() => {
        router.push("/login");
      });
    }

    function resetTimers() {
      if (timer) clearTimeout(timer);
      if (warningTimer) clearTimeout(warningTimer);
      warned = false;

      warningTimer = setTimeout(() => {
        warned = true;
        toast.warning("长时间未操作，1 分钟后将自动退出登录");
      }, IDLE_TIMEOUT - WARNING_BEFORE);

      timer = setTimeout(() => {
        doLogout();
      }, IDLE_TIMEOUT);
    }

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const handleActivity = () => resetTimers();

    resetTimers();

    for (const event of events) {
      document.addEventListener(event, handleActivity, { passive: true });
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (warningTimer) clearTimeout(warningTimer);
      for (const event of events) {
        document.removeEventListener(event, handleActivity);
      }
    };
  }, [router]);

  return null;
}
