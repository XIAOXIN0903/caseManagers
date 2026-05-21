"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
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
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { toast } from "sonner";
import {
  Upload,
  Download,
  Trash2,
  FileText,
  File,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  getDocuments,
  addDocument,
  deleteDocument,
} from "@/lib/actions/documents";
import { DOC_CATEGORIES } from "@/lib/case-constants";

type Doc = NonNullable<
  Awaited<ReturnType<typeof getDocuments>>["data"]
>[number];

function formatSize(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileType?: string | null) {
  if (fileType?.includes("pdf")) return "📄";
  if (fileType?.includes("word") || fileType?.includes("doc")) return "📝";
  if (fileType?.includes("image")) return "🖼️";
  return <File className="h-4 w-4" />;
}

export function DocumentsTab({ caseId }: { caseId: number }) {
  const [items, setItems] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [category, setCategory] = useState("我方文书");
  const [subcategory, setSubcategory] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchItems = useCallback(async () => {
    try {
      const result = await getDocuments(caseId);
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

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("请选择文件");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadResult = await res.json();

      if (!uploadResult.success) {
        toast.error(uploadResult.error || "上传失败");
        return;
      }

      const result = await addDocument(caseId, {
        category,
        subcategory: subcategory || undefined,
        file_name: uploadResult.data.file_name,
        file_url: uploadResult.data.file_url,
        file_size: uploadResult.data.file_size,
        file_type: uploadResult.data.file_type,
      });

      if (result.success) {
        toast.success("文件已上传");
        setDialogOpen(false);
        setSubcategory("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchItems();
      } else {
        toast.error(result.error || "操作失败");
      }
    } catch {
      toast.error("上传失败，请重试");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(docId: number) {
    if (!confirm("确定删除此文件？")) return;
    const result = await deleteDocument(docId, caseId);
    if (result.success) {
      toast.success("文件已删除");
      fetchItems();
    } else {
      toast.error(result.error || "删除失败");
    }
  }

  function toggleCategory(cat: string) {
    setCollapsed((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }

  if (loading) {
    return <p className="text-muted-foreground py-4">加载中...</p>;
  }

  // Group by category
  const grouped = items.reduce<Record<string, Doc[]>>((acc, doc) => {
    const cat = doc.category || "其他";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(doc);
    return acc;
  }, {});

  const subcats = DOC_CATEGORIES[category] || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">文档 ({items.length})</h3>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Upload className="h-4 w-4 mr-1" />
          上传文档
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          暂无文档，请上传
        </p>
      ) : (
        <div className="space-y-1">
          {Object.keys(DOC_CATEGORIES).map((cat) => {
            const docs = grouped[cat] || [];
            return (
              <div key={cat}>
                <button
                  className="flex items-center gap-1 w-full py-2 text-sm font-medium hover:text-foreground text-muted-foreground"
                  onClick={() => toggleCategory(cat)}
                >
                  {collapsed[cat] ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  {cat} ({docs.length})
                </button>
                {!collapsed[cat] && docs.length > 0 && (
                  <div className="ml-4 space-y-1 mb-2">
                    {docs.map((doc) => (
                      <Card key={doc.id}>
                        <CardContent className="flex items-center justify-between py-2 px-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-lg">
                              {getFileIcon(doc.file_type)}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm truncate">{doc.file_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {doc.subcategory && `${doc.subcategory} · `}
                                {formatSize(doc.file_size)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <a href={doc.file_url || "#"} download target="_blank" rel="noreferrer">
                              <Button variant="ghost" size="icon" className="h-8 w-8" type="button">
                                <Download className="h-4 w-4" />
                              </Button>
                            </a>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDelete(doc.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>上传文档</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">文档分类</label>
              <Select value={category} onValueChange={(v) => { setCategory(v || "我方文书"); setSubcategory(""); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(DOC_CATEGORIES).map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {subcats.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">子类</label>
                <Select value={subcategory} onValueChange={(v) => setSubcategory(v || "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择子类（可选）" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">-- 不指定 --</SelectItem>
                    {subcats.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">选择文件</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                className="block w-full text-sm text-muted-foreground
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-primary file:text-primary-foreground
                  hover:file:bg-primary/80"
              />
              <p className="text-xs text-muted-foreground">
                支持 PDF、Word(.doc/.docx)、PNG、JPG
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? "上传中..." : "上传"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
