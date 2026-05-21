"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Key, Download, Upload, MonitorDown, Database, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changing, setChanging] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [installable, setInstallable] = useState(false);

  // Listen for beforeinstallprompt
  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setInstallable(true);
    };
    const onAppInstalled = () => {
      setInstallable(false);
      toast.success("应用已安装到桌面");
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("两次输入的新密码不一致");
      return;
    }
    if (newPassword.length < 4) {
      toast.error("密码至少需要4位");
      return;
    }

    setChanging(true);
    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("密码修改成功，请重新登录");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(data.error || "修改失败");
      }
    } catch {
      toast.error("网络错误，请重试");
    } finally {
      setChanging(false);
    }
  }

  async function handleBackup() {
    setDownloading(true);
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup_${new Date().toISOString().split("T")[0]}.sql`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("备份下载成功");
    } catch {
      toast.error("备份失败，请重试");
    } finally {
      setDownloading(false);
    }
  }

  async function handleRestore(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("恢复备份将覆盖当前所有数据，确定继续？")) {
      e.target.value = "";
      return;
    }

    setRestoring(true);
    try {
      const text = await file.text();
      const res = await fetch("/api/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql: text }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("数据恢复成功");
        window.location.reload();
      } else {
        toast.error(data.error || "恢复失败");
      }
    } catch {
      toast.error("恢复失败，请重试");
    } finally {
      setRestoring(false);
      e.target.value = "";
    }
  }

  async function handleInstall() {
    if (!deferredPrompt) return;
    (deferredPrompt as any).prompt();
    const result = await (deferredPrompt as any).userChoice;
    if (result.outcome === "accepted") {
      setInstallable(false);
      toast.success("应用已添加到桌面");
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold">设置</h1>

      {/* Install PWA */}
      {installable && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MonitorDown className="h-4 w-4" />
              添加到桌面
            </CardTitle>
            <CardDescription>
              将此应用安装到桌面，方便快速访问
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleInstall} className="w-full">
              <MonitorDown className="h-4 w-4 mr-2" />
              安装应用
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Key className="h-4 w-4" />
            修改密码
          </CardTitle>
          <CardDescription>修改登录密码</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current">当前密码</Label>
              <Input
                id="current"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={changing}
                placeholder="请输入当前密码"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPass">新密码</Label>
              <Input
                id="newPass"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={changing}
                placeholder="请输入新密码（至少4位）"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">确认新密码</Label>
              <Input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={changing}
                placeholder="请再次输入新密码"
              />
            </div>
            <Button type="submit" disabled={changing || !currentPassword || !newPassword || !confirmPassword}>
              {changing ? "修改中..." : "修改密码"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Backup & Restore */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-4 w-4" />
            数据管理
          </CardTitle>
          <CardDescription>备份与恢复数据</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">下载备份</p>
              <p className="text-xs text-muted-foreground">导出数据库为 SQL 文件</p>
            </div>
            <Button variant="outline" onClick={handleBackup} disabled={downloading}>
              <Download className="h-4 w-4 mr-2" />
              {downloading ? "下载中..." : "备份"}
            </Button>
          </div>
          <Separator />
          <div>
            <p className="text-sm font-medium mb-1">恢复备份</p>
            <p className="text-xs text-muted-foreground mb-2">
              上传 SQL 备份文件恢复数据（将覆盖当前数据）
            </p>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer hover:bg-accent transition-colors">
              <Upload className="h-4 w-4" />
              <span className="text-sm">{restoring ? "恢复中..." : "选择备份文件"}</span>
              <input
                type="file"
                accept=".sql,.txt"
                onChange={handleRestore}
                disabled={restoring}
                className="hidden"
              />
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
