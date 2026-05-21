"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Search, MoreHorizontal, Plus, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { getCases, deleteCase } from "@/lib/actions/cases";

type CaseItem = NonNullable<
  Awaited<ReturnType<typeof getCases>>["data"]
>["items"][number];

const statusColors: Record<string, string> = {
  "立案": "bg-blue-100 text-blue-800",
  "审理": "bg-yellow-100 text-yellow-800",
  "判决": "bg-orange-100 text-orange-800",
  "执行": "bg-purple-100 text-purple-800",
  "结案": "bg-green-100 text-green-800",
};

const PAGE_SIZE = 10;

export function CasesList({
  initialItems,
  initialTotal,
  statuses,
}: {
  initialItems: CaseItem[];
  initialTotal: number;
  statuses: readonly string[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<CaseItem[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const result = await getCases({
      search,
      status: status === "all" ? "" : status,
      page,
      pageSize: PAGE_SIZE,
    });
    if (result.success && result.data) {
      setItems(result.data.items);
      setTotal(result.data.total);
    }
    setLoading(false);
  }, [search, status, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleDelete(id: number) {
    if (!confirm("确定删除此案件？")) return;
    const result = await deleteCase(id);
    if (result.success) {
      toast.success("案件已删除");
      fetchData();
    } else {
      toast.error(result.error || "删除失败");
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索案号、案由..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onValueChange={(v) => {
            setStatus(v || "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <a
            href={`/api/export?format=csv&search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="outline" className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-1" />
              CSV
            </Button>
          </a>
          <a
            href={`/api/export?format=xlsx&search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="outline" className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-1" />
              Excel
            </Button>
          </a>
          <Link href="/cases/new">
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-1" />
              新增案件
            </Button>
          </Link>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>法院案号</TableHead>
              <TableHead>律所编号</TableHead>
              <TableHead>案由</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>法院</TableHead>
              <TableHead>立案日期</TableHead>
              <TableHead className="w-16">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  暂无案件，请添加第一个案件
                </TableCell>
              </TableRow>
            ) : (
              items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <Link href={`/cases/${c.id}`} className="hover:underline">
                      {c.court_case_number}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.firm_case_number}
                  </TableCell>
                  <TableCell>{c.case_type}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[c.status || "立案"] || ""} variant="outline">
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.court_name}</TableCell>
                  <TableCell className="text-muted-foreground">{c.filing_date}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md h-8 w-8 hover:bg-accent">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/cases/${c.id}`)}>
                          查看
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/cases/${c.id}/edit`)}>
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(c.id)}
                        >
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <p className="text-muted-foreground text-center py-8">加载中...</p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">暂无案件，请添加第一个案件</p>
        ) : (
          items.map((c) => (
            <Link
              key={c.id}
              href={`/cases/${c.id}`}
              className="block border rounded-lg p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{c.court_case_number}</span>
                <Badge className={statusColors[c.status || "立案"] || ""} variant="outline">
                  {c.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {c.case_type} | {c.court_name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {c.firm_case_number} | {c.filing_date}
              </p>
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            共 {total} 条，第 {page}/{totalPages} 页
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
