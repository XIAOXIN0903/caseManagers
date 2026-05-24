const failedAttempts = new Map<
  string,
  { count: number; firstAttempt: number; blockedUntil: number }
>();

export function checkRateLimit(ip: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const entry = failedAttempts.get(ip);

  if (entry?.blockedUntil && entry.blockedUntil > now) {
    const remainingMinutes = Math.ceil((entry.blockedUntil - now) / 60000);
    return {
      allowed: false,
      message: `登录尝试过于频繁，请 ${remainingMinutes} 分钟后重试`,
    };
  }

  if (!entry || now - entry.firstAttempt > 60000) {
    failedAttempts.set(ip, { count: 1, firstAttempt: now, blockedUntil: 0 });
    return { allowed: true };
  }

  entry.count++;

  if (entry.count > 5) {
    entry.blockedUntil = now + 900000;
    return {
      allowed: false,
      message: "登录尝试过于频繁，请 15 分钟后重试",
    };
  }

  return { allowed: true };
}

export function recordFailedAttempt(ip: string): void {
  // failure already recorded in checkRateLimit via the count increment
  // this is a no-op — the count was incremented during the pre-check
  // but we keep it as a semantic hook for the login route
  void ip;
}

// Clean up stale entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of failedAttempts) {
    if (
      (entry.blockedUntil && entry.blockedUntil < now) ||
      (!entry.blockedUntil && now - entry.firstAttempt > 900000)
    ) {
      failedAttempts.delete(ip);
    }
  }
}, 60000);
