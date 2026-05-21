"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search } from "lucide-react";
import { globalSearch, type GlobalSearchResult } from "@/lib/actions/search";

const statusColors: Record<string, string> = {
  "立案": "bg-blue-100 text-blue-800",
  "审理": "bg-yellow-100 text-yellow-800",
  "判决": "bg-orange-100 text-orange-800",
  "执行": "bg-purple-100 text-purple-800",
  "结案": "bg-green-100 text-green-800",
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    const result = await globalSearch(query.trim());
    if (result.success && result.data) setResults(result.data);
    else setResults(null);
    setLoading(false);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">全局搜索</h1>

      <div className="flex gap-2">
        <Input
          placeholder="按案号、当事人姓名、案由搜索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={loading}>
          <Search className="h-4 w-4 mr-1" />
          搜索
        </Button>
      </div>

      {loading && (
        <p className="text-muted-foreground text-center py-8">搜索中...</p>
      )}

      {!loading && searched && !results && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            未找到匹配结果
          </CardContent>
        </Card>
      )}

      {results && (
        <div className="space-y-6">
          {/* Cases */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                案件 ({results.cases.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {results.cases.length === 0 ? (
                <p className="text-sm text-muted-foreground">无匹配案件</p>
              ) : (
                results.cases.map((c) => (
                  <Link
                    key={c.id}
                    href={`/cases/${c.id}`}
                    className="block py-2 px-3 rounded-md hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {c.court_case_number}
                      </span>
                      <Badge
                        className={statusColors[c.status || "立案"] || ""}
                        variant="outline"
                      >
                        {c.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.case_type} · {c.court_name}
                    </p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* Parties */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                当事人 ({results.parties.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {results.parties.length === 0 ? (
                <p className="text-sm text-muted-foreground">无匹配当事人</p>
              ) : (
                results.parties.map((p) => (
                  <Link
                    key={p.id}
                    href={`/cases/${p.case_id}`}
                    className="block py-2 px-3 rounded-md hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{p.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {p.litigation_status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      案件: {p.court_case_number}
                    </p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
