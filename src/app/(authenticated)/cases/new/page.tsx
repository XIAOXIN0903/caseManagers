import { CaseForm } from "@/components/case-form";

export default function NewCasePage() {
  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-bold">新增案件</h1>
      <CaseForm />
    </div>
  );
}
