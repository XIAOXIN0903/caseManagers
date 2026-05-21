"use client";

import { useState } from "react";
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
import { FileDown } from "lucide-react";
import { TEMPLATES } from "@/lib/template-constants";

const templateCustomFields: Record<number, Array<{ key: string; label: string; type: "input" | "textarea" }>> = {
  1: [
    { key: "诉讼请求", label: "诉讼请求", type: "textarea" },
    { key: "事实与理由", label: "事实与理由", type: "textarea" },
  ],
  2: [
    { key: "答辩意见", label: "答辩意见", type: "textarea" },
    { key: "事实与理由", label: "事实与理由", type: "textarea" },
  ],
  3: [
    { key: "trustor", label: "委托人姓名/名称", type: "input" },
    { key: "trustorId", label: "身份证号/统一社会信用代码", type: "input" },
    { key: "lawyer", label: "受托人（律师姓名）", type: "input" },
    { key: "period", label: "代理期限（如：一审终结止）", type: "input" },
  ],
  4: [
    { key: "代理意见", label: "代理意见", type: "textarea" },
  ],
  5: [
    { key: "trustor", label: "委托人姓名/名称", type: "input" },
    { key: "trustorId", label: "身份证号/统一社会信用代码", type: "input" },
    { key: "lawyer", label: "受托人（律师姓名）", type: "input" },
    { key: "period", label: "代理期限（如：一审终结止）", type: "input" },
  ],
};

export function GenerateTab({ caseId }: { caseId: number }) {
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);

  const selectedTemplate = TEMPLATES.find((t) => t.id === templateId);
  const fields = templateId ? templateCustomFields[templateId] || [] : [];

  async function handleGenerate() {
    if (!templateId) {
      toast.error("请选择模板");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/generate-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, templateId, customFields }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "生成失败");
        setGenerating(false);
        return;
      }

      // Download the file
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("Content-Disposition");
      const fileNameMatch = disposition?.match(/filename="?(.+?)"?$/);
      a.download = fileNameMatch?.[1] || "document.docx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("文书已生成");
    } catch {
      toast.error("生成失败，请重试");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium">文书模板生成</h3>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">选择模板</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>模板</Label>
            <Select
              value={templateId?.toString() || ""}
              onValueChange={(v) => {
                setTemplateId(v ? parseInt(v) : null);
                setCustomFields({});
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择文书模板..." />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATES.map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                系统将自动填入案号、当事人名称、法院信息等数据。
              </p>

              {fields.map((f) => (
                <div key={f.key} className="space-y-2">
                  <Label htmlFor={`field-${f.key}`}>{f.label}</Label>
                  {f.type === "textarea" ? (
                    <Textarea
                      id={`field-${f.key}`}
                      value={customFields[f.key] || ""}
                      onChange={(e) =>
                        setCustomFields({
                          ...customFields,
                          [f.key]: e.target.value,
                        })
                      }
                      rows={4}
                      placeholder={`请输入${f.label}`}
                    />
                  ) : (
                    <Input
                      id={`field-${f.key}`}
                      value={customFields[f.key] || ""}
                      onChange={(e) =>
                        setCustomFields({
                          ...customFields,
                          [f.key]: e.target.value,
                        })
                      }
                      placeholder={`请输入${f.label}`}
                    />
                  )}
                </div>
              ))}

              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full"
              >
                <FileDown className="h-4 w-4 mr-2" />
                {generating ? "生成中..." : "生成并下载"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
