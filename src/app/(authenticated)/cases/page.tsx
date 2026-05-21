import { Suspense } from "react";
import { CasesList } from "./cases-list";
import { getCases } from "@/lib/actions/cases";
import { CASE_STATUSES } from "@/lib/case-constants";
import { requireAuth } from "@/lib/auth";

export default async function CasesPage() {
  await requireAuth();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">案件管理</h1>
      </div>
      <Suspense fallback={<div className="text-muted-foreground">加载中...</div>}>
        <CasesListWrapper />
      </Suspense>
    </div>
  );
}

async function CasesListWrapper() {
  const result = await getCases({});
  const items = result.success && result.data ? result.data.items : [];
  const total = result.success && result.data ? result.data.total : 0;

  return <CasesList initialItems={items} initialTotal={total} statuses={CASE_STATUSES} />;
}
