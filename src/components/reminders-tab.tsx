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
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check } from "lucide-react";
import {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  toggleReminder,
} from "@/lib/actions/reminders";
import { REMINDER_TYPES } from "@/lib/case-constants";

type Reminder = NonNullable<
  Awaited<ReturnType<typeof getReminders>>["data"]
>[number];

const typeColors: Record<string, string> = {
  "开庭": "bg-red-100 text-red-800",
  "证据期限": "bg-orange-100 text-orange-800",
  "上诉期限": "bg-purple-100 text-purple-800",
  "时效提醒": "bg-yellow-100 text-yellow-800",
  "自定义": "bg-blue-100 text-blue-800",
};

const emptyForm = {
  title: "",
  reminder_date: new Date().toISOString().split("T")[0],
  reminder_type: "自定义",
  is_completed: 0,
  notes: "",
};

export function RemindersTab({ caseId }: { caseId: number }) {
  const [items, setItems] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const result = await getReminders(caseId);
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

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(r: Reminder) {
    setEditingId(r.id);
    setForm({
      title: r.title || "",
      reminder_date: r.reminder_date || "",
      reminder_type: r.reminder_type || "自定义",
      is_completed: r.is_completed || 0,
      notes: r.notes || "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const result =
      editingId !== null
        ? await updateReminder(editingId, caseId, form)
        : await createReminder(caseId, form);
    if (result.success) {
      toast.success(editingId !== null ? "提醒已更新" : "提醒已添加");
      setDialogOpen(false);
      fetchItems();
    } else {
      toast.error(result.error || "操作失败");
    }
    setSaving(false);
  }

  async function handleToggle(id: number) {
    const result = await toggleReminder(id, caseId);
    if (result.success) fetchItems();
    else toast.error(result.error || "操作失败");
  }

  async function handleDelete(id: number) {
    if (!confirm("确定删除此提醒？")) return;
    const result = await deleteReminder(id, caseId);
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

  const today = new Date().toISOString().split("T")[0];
  const sorted = [...items].sort(
    (a, b) =>
      new Date(a.reminder_date || "").getTime() -
      new Date(b.reminder_date || "").getTime()
  );
  const active = sorted.filter((r) => !r.is_completed);
  const done = sorted.filter((r) => r.is_completed);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">
          提醒 ({active.length} 待处理 / {done.length} 已完成)
        </h3>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          新增提醒
        </Button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">暂无提醒</p>
      ) : (
        <div className="space-y-2">
          {/* Active reminders first */}
          {active.map((r) => {
            const isOverdue = r.reminder_date && r.reminder_date < today;
            return (
              <Card
                key={r.id}
                className={isOverdue ? "border-red-300 bg-red-50/50" : ""}
              >
                <CardContent className="flex items-center justify-between py-3 px-4">
                  <div className="flex items-start gap-3">
                    <button
                      className="mt-0.5 h-5 w-5 rounded border-2 border-muted-foreground/30 hover:border-primary flex items-center justify-center shrink-0"
                      onClick={() => handleToggle(r.id)}
                    >
                      <Check className="h-3 w-3 opacity-0 hover:opacity-50" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{r.title}</span>
                        <Badge
                          className={typeColors[r.reminder_type || "自定义"] || ""}
                          variant="outline"
                        >
                          {r.reminder_type}
                        </Badge>
                        {isOverdue && (
                          <Badge variant="outline" className="bg-red-100 text-red-800">
                            已过期
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {r.reminder_date}
                        {r.notes && ` · ${r.notes}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(r)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(r.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Completed reminders */}
          {done.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground pt-2">已完成</p>
              {done.map((r) => (
                <Card key={r.id} className="opacity-60">
                  <CardContent className="flex items-center justify-between py-3 px-4">
                    <div className="flex items-start gap-3">
                      <button
                        className="mt-0.5 h-5 w-5 rounded border-2 bg-primary border-primary flex items-center justify-center shrink-0"
                        onClick={() => handleToggle(r.id)}
                      >
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm line-through">
                            {r.title}
                          </span>
                          <Badge
                            className={typeColors[r.reminder_type || "自定义"] || ""}
                            variant="outline"
                          >
                            {r.reminder_type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {r.reminder_date}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={() => handleDelete(r.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId !== null ? "编辑提醒" : "新增提醒"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reminder-title">标题 *</Label>
              <Input
                id="reminder-title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="开庭提醒、证据提交截止..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>提醒类型</Label>
                <Select
                  value={form.reminder_type}
                  onValueChange={(v) =>
                    setForm({ ...form, reminder_type: v || "自定义" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reminder-date">日期 *</Label>
                <Input
                  id="reminder-date"
                  type="date"
                  value={form.reminder_date}
                  onChange={(e) =>
                    setForm({ ...form, reminder_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminder-notes">备注</Label>
              <Textarea
                id="reminder-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
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
