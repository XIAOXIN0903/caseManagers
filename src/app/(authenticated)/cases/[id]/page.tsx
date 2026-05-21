import { getCase } from "@/lib/actions/cases";
import { requireAuth } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Edit } from "lucide-react";
import { PartiesTab } from "@/components/parties-tab";
import { ProgressTab } from "@/components/progress-tab";
import { CommunicationsTab } from "@/components/communications-tab";
import { DocumentsTab } from "@/components/documents-tab";
import { GenerateTab } from "@/components/generate-tab";
import { FeesTab } from "@/components/fees-tab";
import { RemindersTab } from "@/components/reminders-tab";

const statusColors: Record<string, string> = {
  "立案": "bg-blue-100 text-blue-800",
  "审理": "bg-yellow-100 text-yellow-800",
  "判决": "bg-orange-100 text-orange-800",
  "执行": "bg-purple-100 text-purple-800",
  "结案": "bg-green-100 text-green-800",
};

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-1.5">
      <span className="text-sm text-muted-foreground w-32 shrink-0">{label}</span>
      <span className="text-sm">{String(value)}</span>
    </div>
  );
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const result = await getCase(parseInt(id));

  if (!result.success || !result.data) {
    notFound();
  }

  const c = result.data;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/cases">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">{c.court_case_number}</h1>
            <p className="text-sm text-muted-foreground">{c.firm_case_number}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusColors[c.status || "立案"] || ""} variant="outline">
            {c.status}
          </Badge>
          <Link href={`/cases/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-1" />
              编辑
            </Button>
          </Link>
        </div>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="w-full flex overflow-x-auto border-b pb-px">
          <TabsTrigger value="info">基本信息</TabsTrigger>
          <TabsTrigger value="parties">当事人</TabsTrigger>
          <TabsTrigger value="progress">案件进展</TabsTrigger>
          <TabsTrigger value="documents">文档</TabsTrigger>
          <TabsTrigger value="fees">收费</TabsTrigger>
          <TabsTrigger value="reminders">提醒</TabsTrigger>
          <TabsTrigger value="communications">沟通记录</TabsTrigger>
          <TabsTrigger value="generate">文书生成</TabsTrigger>
        </TabsList>

        {/* 基本信息 Tab */}
        <TabsContent value="info" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>案件信息</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="案由" value={c.case_type} />
              <InfoRow label="法院案号" value={c.court_case_number} />
              <InfoRow label="律所管理号" value={c.firm_case_number} />
              <InfoRow label="立案日期" value={c.filing_date} />
              <InfoRow label="案件状态" value={c.status} />
              <InfoRow
                label="标的额"
                value={c.claim_amount ? `¥${c.claim_amount.toLocaleString()}` : undefined}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>法院信息</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="受理法院" value={c.court_name} />
              <InfoRow label="主审法官" value={c.presiding_judge} />
              <InfoRow label="法官联系方式" value={c.judge_phone} />
              <InfoRow label="法官助理/书记员" value={c.judge_assistant} />
              <InfoRow label="助理联系方式" value={c.assistant_phone} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>对方律师信息</CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="代理律师" value={c.opposing_counsel} />
              <InfoRow label="律所" value={c.opposing_firm} />
              <InfoRow label="联系方式" value={c.opposing_phone} />
            </CardContent>
          </Card>

          {c.description && (
            <Card>
              <CardHeader>
                <CardTitle>案情描述/备注</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{c.description}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Parties tab */}
        <TabsContent value="parties" className="mt-4">
          <PartiesTab caseId={c.id} />
        </TabsContent>
        {/* Progress tab */}
        <TabsContent value="progress" className="mt-4">
          <ProgressTab caseId={c.id} />
        </TabsContent>
        {/* Communications tab */}
        <TabsContent value="communications" className="mt-4">
          <CommunicationsTab caseId={c.id} />
        </TabsContent>
        {/* Documents tab */}
        <TabsContent value="documents" className="mt-4">
          <DocumentsTab caseId={c.id} />
        </TabsContent>
        {/* Fees tab */}
        <TabsContent value="fees" className="mt-4">
          <FeesTab caseId={c.id} />
        </TabsContent>
        {/* Reminders tab */}
        <TabsContent value="reminders" className="mt-4">
          <RemindersTab caseId={c.id} />
        </TabsContent>
        {/* Generate documents tab */}
        <TabsContent value="generate" className="mt-4">
          <GenerateTab caseId={c.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
