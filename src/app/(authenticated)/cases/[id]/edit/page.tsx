import { getCase } from "@/lib/actions/cases";
import { notFound } from "next/navigation";
import { CaseForm } from "@/components/case-form";

export default async function EditCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getCase(parseInt(id));

  if (!result.success || !result.data) {
    notFound();
  }

  const c = result.data;

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-bold">编辑案件</h1>
      <CaseForm
        isEdit
        defaultValues={{
          id: c.id,
          court_case_number: c.court_case_number || "",
          firm_case_number: c.firm_case_number || "",
          case_type: c.case_type || "",
          court_name: c.court_name || "",
          presiding_judge: c.presiding_judge || "",
          judge_phone: c.judge_phone || "",
          judge_assistant: c.judge_assistant || "",
          assistant_phone: c.assistant_phone || "",
          filing_date: c.filing_date || "",
          status: c.status || "立案",
          claim_amount: c.claim_amount || 0,
          opposing_counsel: c.opposing_counsel || "",
          opposing_firm: c.opposing_firm || "",
          opposing_phone: c.opposing_phone || "",
          description: c.description || "",
        }}
      />
    </div>
  );
}
