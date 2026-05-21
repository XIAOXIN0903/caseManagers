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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  getCommunications,
  createCommunication,
  updateCommunication,
  deleteCommunication,
} from "@/lib/actions/communications";
import { COMM_METHODS } from "@/lib/case-constants";

type Comm = NonNullable<
  Awaited<ReturnType<typeof getCommunications>>["data"]
>[number];

const methodColors: Record<string, string> = {
  "电话": "bg-blue-100 text-blue-800",
  "微信": "bg-green-100 text-green-800",
  "面谈": "bg-purple-100 text-purple-800",
  "邮件": "bg-orange-100 text-orange-800",
  "其他": "bg-gray-100 text-gray-800",
};

const emptyForm = {
  communication_date: new Date().toISOString().split("T")[0],
  method: "电话",
  contact_person: "",
  summary: "",
};

export function CommunicationsTab({ caseId }: { caseId: number }) {
  const [items, setItems] = useState<Comm[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");

  const fetchItems = useCallback(async () => {
    try {
      const result = await getCommunications(caseId);
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

  function openEdit(c: Comm) {
    setEditingId(c.id);
    setForm({
      communication_date: c.communication_date || "",
      method: c.method || "电话",
      contact_person: c.contact_person || "",
      summary: c.summary || "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const result =
      editingId !== null
        ? await updateCommunication(editingId, caseId, form)
        : await createCommunication(caseId, form);
    if (result.success) {
      toast.success(editingId !== null ? "记录已更新" : "记录已添加");
      setDialogOpen(false);
      fetchItems();
    } else {
      toast.error(result.error || "操作失败");
    }
    setSaving(false);
  }

  async function handleDelete(id: number) {
    if (!confirm("确定删除此记录？")) return;
    const result = await deleteCommunication(id, caseId);
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

  // Sort by date descending
  const filtered = filter === "all"
    ? items
    : items.filter((i) => i.method === filter);
  const sorted = [...filtered].sort(
    (a, b) =>
      new Date(b.communication_date || "").getTime() -
      new Date(a.communication_date || "").getTime()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">沟通记录 ({items.length})</h3>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          新增记录
        </Button>
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 flex-wrap">
        <Badge
          variant={filter === "all" ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setFilter("all")}
        >
          全部
        </Badge>
        {COMM_METHODS.map((m) => (
          <Badge
            key={m}
            variant={filter === m ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilter(m)}
          >
            {m}
          </Badge>
        ))}
      </div>

      {sorted.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">暂无沟通记录</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((c) => (
            <Card key={c.id}>
              <CardContent className="py-3 px-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        className={methodColors[c.method || "其他"] || ""}
                        variant="outline"
                      >
                        {c.method}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {c.communication_date}
                      </span>
                    </div>
                    {c.contact_person && (
                      <p className="text-sm font-medium mb-1">
                        沟通对象：{c.contact_person}
                      </p>
                    )}
                    {c.summary && (
                      <p className="text-sm whitespace-pre-wrap">
                        {c.summary}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(c)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(c.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId !== null ? "编辑沟通记录" : "新增沟通记录"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comm-date">沟通日期 *</Label>
              <Input
                id="comm-date"
                type="date"
                value={form.communication_date}
                onChange={(e) =>
                  setForm({ ...form, communication_date: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>沟通方式</Label>
              <Select
                value={form.method}
                onValueChange={(v) =>
                  setForm({ ...form, method: v || "电话" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMM_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comm-person">沟通对象</Label>
              <Input
                id="comm-person"
                value={form.contact_person}
                onChange={(e) =>
                  setForm({ ...form, contact_person: e.target.value })
                }
                placeholder="当事人名/对方律师名等"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comm-summary">内容摘要</Label>
              <Textarea
                id="comm-summary"
                value={form.summary}
                onChange={(e) =>
                  setForm({ ...form, summary: e.target.value })
                }
                rows={4}
                placeholder="记录沟通内容..."
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
