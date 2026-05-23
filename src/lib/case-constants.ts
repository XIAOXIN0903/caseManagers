import { z } from "zod";

export const CASE_STATUSES = [
  "立案", "审理", "一审判决", "二审判决", "再审",
  "执行", "调解", "撤诉", "结案", "已结委托",
] as const;

export const LITIGATION_STATUSES = [
  "原告", "被告", "反诉原告", "反诉被告", "第三人",
  "申请人", "被申请人", "上诉人", "被上诉人",
  "申请执行人", "被执行人",
] as const;

export const EVENT_TYPES = [
  "立案", "开庭", "证据提交", "判决", "上诉", "执行", "其他",
] as const;

export const REMINDER_TYPES = [
  "开庭", "证据期限", "上诉期限", "时效提醒", "自定义",
] as const;

export const COMM_METHODS = ["电话", "微信", "面谈", "邮件", "其他"] as const;

export const DOC_CATEGORIES: Record<string, string[]> = {
  "我方文书": ["起诉状/答辩状", "代理词/辩护词", "证据清单及材料", "授权委托书", "律所函"],
  "法院文书": ["受理通知书", "开庭传票", "判决书/裁定书/调解书"],
  "对方材料": ["对方起诉状/答辩状", "对方证据"],
  "收费凭证": ["发票", "收费协议", "进账凭证"],
  "其他": [],
};

export const caseSchema = z.object({
  court_case_number: z.string().min(1, "必填"),
  firm_case_number: z.string().min(1, "必填"),
  case_type: z.string().optional().default(""),
  court_name: z.string().optional().default(""),
  presiding_judge: z.string().optional().default(""),
  judge_phone: z.string().optional().default(""),
  judge_assistant: z.string().optional().default(""),
  assistant_phone: z.string().optional().default(""),
  filing_date: z.string().optional().default(""),
  status: z.string().optional().default("立案"),
  claim_amount: z.number().optional().default(0),
  opposing_counsel: z.string().optional().default(""),
  opposing_firm: z.string().optional().default(""),
  opposing_phone: z.string().optional().default(""),
  description: z.string().optional().default(""),
});

export type CaseInput = z.infer<typeof caseSchema>;
