"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import {
  getParties,
  createParty,
  updateParty,
  deleteParty,
  checkConflict,
  type ConflictResult,
} from "@/lib/actions/parties";
import { LITIGATION_STATUSES } from "@/lib/case-constants";

type Party = NonNullable<Awaited<ReturnType<typeof getParties>>["data"]>[number];

type PartyFormData = {
  name: string;
  litigation_status: string;
  phone: string;
  notes: string;
};

const emptyForm: PartyFormData = {
  name: "",
  litigation_status: "",
  phone: "",
  notes: "",
};

export function PartiesTab({ caseId }: { caseId: number }) {
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PartyFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState<ConflictResult | null>(null);
  const [checkingConflict, setCheckingConflict] = useState(false);

  const fetchParties = useCallback(async () => {
    try {
      const result = await getParties(caseId);
      if (result.success && result.data) setParties(result.data);
    } catch {
      // action threw
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchParties();
  }, [fetchParties]);

  async function handleConflictCheck(name: string) {
    if (name.length < 2) {
      setConflict(null);
      return;
    }
    setCheckingConflict(true);
    const result = await checkConflict(name, caseId);
    if (result.success && result.data) setConflict(result.data);
    else setConflict(null);
    setCheckingConflict(false);
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setConflict(null);
    setDialogOpen(true);
  }

  function openEdit(p: Party) {
    setEditingId(p.id);
    setForm({
      name: p.name || "",
      litigation_status: p.litigation_status || "",
      phone: p.phone || "",
      notes: p.notes || "",
    });
    setConflict(null);
    setDialogOpen(true);
  }

  function toggleStatus(status: string) {
    const current = form.litigation_status
      ? form.litigation_status.split(",")
      : [];
    const exists = current.includes(status);
    const next = exists
      ? current.filter((s) => s !== status)
      : [...current, status];
    setForm({ ...form, litigation_status: next.join(",") });
  }

  async function handleSave() {
    if (!form.name || !form.litigation_status) {
      toast.error("姓名和诉讼地位必填");
      return;
    }
    setSaving(true);
    const result =
      editingId !== null
        ? await updateParty(editingId, caseId, form)
        : await createParty(caseId, form);
    if (result.success) {
      toast.success(editingId !== null ? "当事人已更新" : "当事人已添加");
      setDialogOpen(false);
      fetchParties();
    } else {
      toast.error(result.error || "操作失败");
    }
    setSaving(false);
  }

  async function handleDelete(id: number) {
    if (!confirm("确定删除此当事人？")) return;
    const result = await deleteParty(id, caseId);
    if (result.success) {
      toast.success("已删除");
      fetchParties();
    } else {
      toast.error(result.error || "删除失败");
    }
  }

  if (loading) {
    return <p className="text-muted-foreground py-4">加载中...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">
          当事人 ({parties.length})
        </h3>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          添加当事人
        </Button>
      </div>

      {parties.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">暂无当事人</p>
      ) : (
        <div className="space-y-2">
          {parties.map((p) => (
            <Card key={p.id}>
              <CardContent className="flex items-center justify-between py-3 px-4">
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {p.phone && `${p.phone} · `}
                    {p.litigation_status}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(p)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(p.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
              {editingId !== null ? "编辑当事人" : "添加当事人"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="party-name">姓名/名称 *</Label>
              <Input
                id="party-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                onBlur={(e) => handleConflictCheck(e.target.value)}
                placeholder="当事人姓名"
              />
              {checkingConflict && (
                <p className="text-xs text-muted-foreground">正在检查冲突...</p>
              )}
              {conflict && (
                <div className="flex items-start gap-2 p-2 rounded bg-yellow-50 text-yellow-800 text-xs">
                  <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">潜在利益冲突</p>
                    <p>
                      该当事人在案件 {conflict.case_numbers.join("、")} 中出现过（
                      {conflict.statuses.join("、")}），请确认是否存在利益冲突。
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>诉讼地位 *（可多选）</Label>
              <div className="flex flex-wrap gap-1.5">
                {LITIGATION_STATUSES.map((s) => {
                  const selected = form.litigation_status.split(",").includes(s);
                  return (
                    <Badge
                      key={s}
                      variant={selected ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleStatus(s)}
                    >
                      {s}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="party-phone">联系方式</Label>
              <Input
                id="party-phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="party-notes">备注</Label>
              <Textarea
                id="party-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
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
