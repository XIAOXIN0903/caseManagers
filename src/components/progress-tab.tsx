"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  getProgress,
  createProgress,
  deleteProgress,
} from "@/lib/actions/progress";
import { EVENT_TYPES } from "@/lib/case-constants";

type Progress = NonNullable<Awaited<ReturnType<typeof getProgress>>["data"]>[number];

const eventColors: Record<string, string> = {
  "立案": "bg-blue-100 text-blue-800",
  "开庭": "bg-orange-100 text-orange-800",
  "证据提交": "bg-purple-100 text-purple-800",
  "判决": "bg-red-100 text-red-800",
  "上诉": "bg-yellow-100 text-yellow-800",
  "执行": "bg-green-100 text-green-800",
  "其他": "bg-gray-100 text-gray-800",
};

export function ProgressTab({ caseId }: { caseId: number }) {
  const [items, setItems] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    event_type: "开庭",
    event_date: new Date().toISOString().split("T")[0],
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const result = await getProgress(caseId);
      if (result.success && result.data) setItems(result.data);
    } catch {
      // action threw
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function handleSave() {
    if (!form.event_date) {
      toast.error("请选择日期");
      return;
    }
    setSaving(true);
    const result = await createProgress(caseId, form);
    if (result.success) {
      toast.success("事件已添加");
      setDialogOpen(false);
      setForm({
        event_type: "开庭",
        event_date: new Date().toISOString().split("T")[0],
        description: "",
      });
      fetchItems();
    } else {
      toast.error(result.error || "操作失败");
    }
    setSaving(false);
  }

  async function handleDelete(id: number) {
    if (!confirm("确定删除此事件？")) return;
    const result = await deleteProgress(id, caseId);
    if (result.success) {
      toast.success("已删除");
      fetchItems();
    } else {
      toast.error(result.error || "删除失败");
    }
  }

  if (loading) {
    return <p className="text-muted-foreground py-4">加载中...</p>;
  }

  // Sort by date descending for timeline (newest on top)
  const sorted = [...items].sort(
    (a, b) => new Date(b.event_date || "").getTime() - new Date(a.event_date || "").getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">案件进展 ({items.length})</h3>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          新增事件
        </Button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">暂无进展记录</p>
      ) : (
        <div className="relative ml-4 border-l-2 border-muted pl-6 space-y-6 py-2">
          {sorted.map((item) => (
            <div key={item.id} className="relative">
              {/* Dot */}
              <div className="absolute -left-[1.625rem] top-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className={eventColors[item.event_type || "其他"] || ""} variant="outline">
                      {item.event_type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {item.event_date}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-sm mt-1.5">{item.description}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground shrink-0"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增案件事件</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>事件类型</Label>
              <Select
                value={form.event_type}
                onValueChange={(v) =>
                  setForm({ ...form, event_type: v || "开庭" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-date">日期 *</Label>
              <Input
                id="event-date"
                type="date"
                value={form.event_date}
                onChange={(e) =>
                  setForm({ ...form, event_date: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-desc">描述</Label>
              <Textarea
                id="event-desc"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
