"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { createCase, updateCase } from "@/lib/actions/cases";
import { CASE_STATUSES, type CaseInput } from "@/lib/case-constants";

type Props = {
  defaultValues?: Partial<CaseInput> & { id?: number };
  isEdit?: boolean;
};

export function CaseForm({ defaultValues, isEdit }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CaseInput>({
    court_case_number: defaultValues?.court_case_number || "",
    firm_case_number: defaultValues?.firm_case_number || "",
    case_type: defaultValues?.case_type || "",
    court_name: defaultValues?.court_name || "",
    presiding_judge: defaultValues?.presiding_judge || "",
    judge_phone: defaultValues?.judge_phone || "",
    judge_assistant: defaultValues?.judge_assistant || "",
    assistant_phone: defaultValues?.assistant_phone || "",
    filing_date: defaultValues?.filing_date || "",
    status: defaultValues?.status || "立案",
    claim_amount: defaultValues?.claim_amount || 0,
    opposing_counsel: defaultValues?.opposing_counsel || "",
    opposing_firm: defaultValues?.opposing_firm || "",
    opposing_phone: defaultValues?.opposing_phone || "",
    description: defaultValues?.description || "",
  });

  function update<K extends keyof CaseInput>(key: K, value: CaseInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = isEdit && defaultValues?.id
      ? await updateCase(defaultValues.id, form)
      : await createCase(form);

    if (result.success) {
      toast.success(isEdit ? "案件已更新" : "案件已创建");
      router.push(isEdit && defaultValues?.id
        ? `/cases/${defaultValues.id}`
        : `/cases/${result.data?.id}`
      );
    } else {
      toast.error(result.error || "操作失败，请重试");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="court_case_number">法院案号 *</Label>
            <Input
              id="court_case_number"
              value={form.court_case_number}
              onChange={(e) => update("court_case_number", e.target.value)}
              placeholder="(2026)粤0106民初1234号"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="firm_case_number">律所管理号 *</Label>
            <Input
              id="firm_case_number"
              value={form.firm_case_number}
              onChange={(e) => update("firm_case_number", e.target.value)}
              placeholder="AL2026-001"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="case_type">案由</Label>
            <Input
              id="case_type"
              value={form.case_type}
              onChange={(e) => update("case_type", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">案件状态</Label>
            <Select
              value={form.status}
              onValueChange={(v) => update("status", v || "立案")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CASE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="claim_amount">标的额（元）</Label>
            <Input
              id="claim_amount"
              type="number"
              value={form.claim_amount || ""}
              onChange={(e) =>
                update("claim_amount", parseFloat(e.target.value) || 0)
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filing_date">立案日期</Label>
            <Input
              id="filing_date"
              type="date"
              value={form.filing_date}
              onChange={(e) => update("filing_date", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 法院信息 */}
      <Card>
        <CardHeader>
          <CardTitle>受理法院信息</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="court_name">受理法院/仲裁机构</Label>
            <Input
              id="court_name"
              value={form.court_name}
              onChange={(e) => update("court_name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="presiding_judge">主审法官</Label>
            <Input
              id="presiding_judge"
              value={form.presiding_judge}
              onChange={(e) => update("presiding_judge", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="judge_phone">法官联系方式</Label>
            <Input
              id="judge_phone"
              value={form.judge_phone}
              onChange={(e) => update("judge_phone", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="judge_assistant">法官助理/书记员</Label>
            <Input
              id="judge_assistant"
              value={form.judge_assistant}
              onChange={(e) => update("judge_assistant", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assistant_phone">助理联系方式</Label>
            <Input
              id="assistant_phone"
              value={form.assistant_phone}
              onChange={(e) => update("assistant_phone", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 对方律师信息 */}
      <Card>
        <CardHeader>
          <CardTitle>对方律师信息</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="opposing_counsel">对方代理律师</Label>
            <Input
              id="opposing_counsel"
              value={form.opposing_counsel}
              onChange={(e) => update("opposing_counsel", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="opposing_firm">对方律所</Label>
            <Input
              id="opposing_firm"
              value={form.opposing_firm}
              onChange={(e) => update("opposing_firm", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="opposing_phone">对方律师联系方式</Label>
            <Input
              id="opposing_phone"
              value={form.opposing_phone}
              onChange={(e) => update("opposing_phone", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 备注 */}
      <Card>
        <CardHeader>
          <CardTitle>案情描述/备注</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={4}
            placeholder="案件摘要、特殊事项等..."
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "保存中..." : isEdit ? "更新案件" : "创建案件"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          取消
        </Button>
      </div>
    </form>
  );
}
