import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDashboardData, type DashboardData } from "@/lib/actions/dashboard";
import { requireAuth } from "@/lib/auth";
import { Calendar, Clock, Bell, FolderOpen, Banknote, AlertTriangle } from "lucide-react";

const statusColors: Record<string, string> = {
  "立案": "bg-blue-100 text-blue-800",
  "审理": "bg-yellow-100 text-yellow-800",
  "判决": "bg-orange-100 text-orange-800",
  "执行": "bg-purple-100 text-purple-800",
  "结案": "bg-green-100 text-green-800",
};

export default async function DashboardPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">仪表盘</h1>
      <Suspense fallback={<DashboardFallback />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}

function DashboardFallback() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i}>
          <CardContent className="py-6">
            <div className="h-4 bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function DashboardContent() {
  const result = await getDashboardData();

  if (!result.success || !result.data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          暂无数据。请先添加案件。
        </CardContent>
      </Card>
    );
  }

  const d: DashboardData = result.data;

  return (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FolderOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">进行中案件</p>
              <p className="text-2xl font-bold">{d.activeCasesCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Bell className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">待办事项</p>
              <p className="text-2xl font-bold">{d.pendingReminders}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">时效预警</p>
              <p className="text-2xl font-bold text-red-600">
                {d.overdueReminders}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Banknote className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">已收费用</p>
              <p className="text-2xl font-bold text-emerald-600">
                ¥{d.totalReceived.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming courts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              近期开庭
            </CardTitle>
            <Link
              href="/calendar"
              className="text-sm text-muted-foreground hover:underline"
            >
              日历视图
            </Link>
          </CardHeader>
          <CardContent>
            {d.upcomingCourts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                暂无近期开庭安排
              </p>
            ) : (
              <div className="space-y-2">
                {d.upcomingCourts.map((court, i) => (
                  <Link
                    key={i}
                    href={`/cases/${court.caseId}`}
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-accent transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{court.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {court.caseNumber}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {court.date}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent cases */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-4 w-4" />
              最近案件
            </CardTitle>
            <Link
              href="/cases"
              className="text-sm text-muted-foreground hover:underline"
            >
              全部案件
            </Link>
          </CardHeader>
          <CardContent>
            {d.recentCases.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                暂无案件
              </p>
            ) : (
              <div className="space-y-2">
                {d.recentCases.map((c) => (
                  <Link
                    key={c.id}
                    href={`/cases/${c.id}`}
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-accent transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {c.court_case_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {c.case_type}
                      </p>
                    </div>
                    <Badge
                      className={statusColors[c.status || "立案"] || ""}
                      variant="outline"
                    >
                      {c.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
