"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, RotateCcw } from "lucide-react";
import {
  getDeletedItems,
  restoreItem,
  permanentDelete,
  type DeletedItem,
} from "@/lib/actions/recycle-bin";

const tableLabels: Record<string, string> = {
  cases: "案件",
  parties: "当事人",
  reminders: "提醒",
  communication_logs: "沟通记录",
};

export default function RecycleBinPage() {
  const [items, setItems] = useState<DeletedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    const result = await getDeletedItems();
    if (result.success && result.data) setItems(result.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function handleRestore(item: DeletedItem) {
    const result = await restoreItem(item.table, item.id);
    if (result.success) {
      toast.success("已恢复");
      fetchItems();
    } else {
      toast.error(result.error || "恢复失败");
    }
  }

  async function handlePermanentDelete(item: DeletedItem) {
    if (!confirm(`确定永久删除此项？此操作不可撤销。`)) return;
    const result = await permanentDelete(item.table, item.id);
    if (result.success) {
      toast.success("已永久删除");
      fetchItems();
    } else {
      toast.error(result.error || "删除失败");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">回收站</h1>
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  // Group by table
  const grouped: Record<string, DeletedItem[]> = {};
  for (const item of items) {
    if (!grouped[item.table]) grouped[item.table] = [];
    grouped[item.table].push(item);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">回收站</h1>
          <p className="text-sm text-muted-foreground mt-1">
            已删除超过 30 天的记录将自动清理
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            回收站为空
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([table, tableItems]) => (
          <Card key={table}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {tableLabels[table] || table}
                <Badge variant="secondary">{tableItems.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tableItems.map((item) => (
                <div
                  key={`${item.table}-${item.id}`}
                  className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {item.label || `ID: ${item.id}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      删除时间: {item.deleted_at || "未知"}
                      {item.case_id && ` · 案件 ID: ${item.case_id}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestore(item)}
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1" />
                      恢复
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handlePermanentDelete(item)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      永久删除
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
