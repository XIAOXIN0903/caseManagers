"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
import {
  getFees,
  createFee,
  updateFee,
  deleteFee,
} from "@/lib/actions/fees";

type Fee = NonNullable<Awaited<ReturnType<typeof getFees>>["data"]>[number];

const emptyForm = {
  payment_status: "未收",
  is_deposited: 0,
  amount: 0,
  invoice_url: "",
  received_date: "",
  notes: "",
};

export function FeesTab({ caseId }: { caseId: number }) {
  const [items, setItems] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const result = await getFees(caseId);
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

  function openEdit(f: Fee) {
    setEditingId(f.id);
    setForm({
      payment_status: f.payment_status || "未收",
      is_deposited: f.is_deposited || 0,
      amount: f.amount || 0,
      invoice_url: f.invoice_url || "",
      received_date: f.received_date || "",
      notes: f.notes || "",
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const result =
      editingId !== null
        ? await updateFee(editingId, caseId, form)
        : await createFee(caseId, form);
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
    if (!confirm("确定删除此收费记录？")) return;
    const result = await deleteFee(id, caseId);
    if (result.success) {
      toast.success("已删除");
      fetchItems();
    } else {
      toast.error(result.error || "删除失败");
    }
  }

  async function handleInvoiceUpload() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.png,.jpg,.jpeg";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success && data.data) {
        setForm({ ...form, invoice_url: data.data.file_url });
        toast.success("发票已上传");
      } else {
        toast.error("上传失败");
      }
    };
    input.click();
  }

  if (loading) {
    return <p className="text-muted-foreground py-4">加载中...</p>;
  }

  const totalReceived = items
    .filter((i) => i.payment_status === "已收")
    .reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalPending = items
    .filter((i) => i.payment_status === "未收")
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">已收合计</p>
            <p className="text-lg font-bold text-green-600">
              ¥{totalReceived.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-4">
            <p className="text-xs text-muted-foreground">未收合计</p>
            <p className="text-lg font-bold text-orange-600">
              ¥{totalPending.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-medium">收费记录 ({items.length})</h3>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          新增记录
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">暂无收费记录</p>
      ) : (
        <div className="space-y-2">
          {items.map((f) => (
            <Card key={f.id}>
              <CardContent className="flex items-center justify-between py-3 px-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      ¥{(f.amount || 0).toLocaleString()}
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        f.payment_status === "已收"
                          ? "bg-green-100 text-green-800"
                          : "bg-orange-100 text-orange-800"
                      }
                    >
                      {f.payment_status}
                    </Badge>
                    {f.is_deposited === 1 && (
                      <span className="text-xs text-muted-foreground">已入公账</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {f.received_date && `收款日: ${f.received_date} · `}
                    {f.notes || ""}
                  </p>
                  {f.invoice_url && (
                    <a
                      href={f.invoice_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      查看发票
                    </a>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(f)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(f.id)}
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
              {editingId !== null ? "编辑收费记录" : "新增收费记录"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>收取状态</Label>
                <Select
                  value={form.payment_status}
                  onValueChange={(v) =>
                    setForm({ ...form, payment_status: v || "未收" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="未收">未收</SelectItem>
                    <SelectItem value="已收">已收</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>金额（元）</Label>
                <Input
                  type="number"
                  value={form.amount || ""}
                  onChange={(e) =>
                    setForm({ ...form, amount: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>是否入公账</Label>
              <Select
                value={form.is_deposited?.toString() || "0"}
                onValueChange={(v) =>
                  setForm({ ...form, is_deposited: parseInt(v || "0") || 0 })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">未入公账</SelectItem>
                  <SelectItem value="1">已入公账</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>收款日期</Label>
              <Input
                type="date"
                value={form.received_date}
                onChange={(e) =>
                  setForm({ ...form, received_date: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>发票</Label>
              <div className="flex gap-2 items-center">
                <Input
                  value={form.invoice_url}
                  onChange={(e) =>
                    setForm({ ...form, invoice_url: e.target.value })
                  }
                  placeholder="发票链接或上传"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleInvoiceUpload}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>备注</Label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="备注信息"
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
