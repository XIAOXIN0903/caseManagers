import { db } from "@/lib/db";
import { cases, parties, notDeleted } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { TEMPLATES } from "@/lib/template-constants";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
export { TEMPLATES };

interface CaseData {
  court_case_number: string;
  firm_case_number: string;
  case_type: string;
  court_name: string;
  plaintiff_name: string;
  defendant_name: string;
}

function escXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function xmlRun(text: string, bold?: boolean, fontSize?: number): string {
  const rPr: string[] = [];
  rPr.push('<w:rFonts w:eastAsia="SimSun" w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>');
  if (bold) rPr.push("<w:b/>");
  if (fontSize) rPr.push(`<w:sz w:val="${fontSize * 2}"/>`);
  rPr.push(`<w:szCs w:val="${(fontSize || 12) * 2}"/>`);
  return `<w:r><w:rPr>${rPr.join("")}</w:rPr><w:t xml:space="preserve">${escXml(text)}</w:t></w:r>`;
}

function xmlParagraph(runs: string[], spacing?: number, alignment?: string): string {
  const pPr: string[] = [];
  if (spacing) pPr.push(`<w:spacing w:after="${spacing}"/>`);
  if (alignment) pPr.push(`<w:jc w:val="${alignment}"/>`);
  const pPrXml = pPr.length > 0 ? `<w:pPr>${pPr.join("")}</w:pPr>` : "";
  return `<w:p>${pPrXml}${runs.join("")}</w:p>`;
}

const FONT = 14; // 四号

function buildAuthorizationDoc(
  paras: string[],
  templateName: string,
  data: CaseData,
  custom: Record<string, string>
) {
  const isSpecial = templateName.includes("特别授权");
  const trustor = custom["trustor"] || data.plaintiff_name || "________";
  const trustorId = custom["trustorId"] || "________________";
  const lawyer = custom["lawyer"] || "________________";
  const period = custom["period"] || "________";
  const caseDesc = data.case_type || "________";

  paras.push(xmlParagraph([xmlRun("", false, FONT)], 80));

  // 委托人信息
  paras.push(xmlParagraph([
    xmlRun("委托人：", false, FONT),
    xmlRun(trustor, false, FONT),
  ], 60));
  paras.push(xmlParagraph([
    xmlRun("身份证号码/统一社会信用代码：", false, FONT),
    xmlRun(trustorId, false, FONT),
  ], 60));

  // 受托人
  paras.push(xmlParagraph([
    xmlRun("受托人：", false, FONT),
    xmlRun(`${lawyer}，广东国晖律师事务所律师`, false, FONT),
  ], 60));

  paras.push(xmlParagraph([xmlRun("", false, FONT)], 80));

  // 委托事项
  paras.push(xmlParagraph([
    xmlRun("委托人因", false, FONT),
    xmlRun(caseDesc, false, FONT),
    xmlRun("一案，委托上述律师担任其代理人。代理期限至", false, FONT),
    xmlRun(period, false, FONT),
    xmlRun("终结止。", false, FONT),
  ], 120));

  paras.push(xmlParagraph([xmlRun("委托代理事项和权限如下：", false, FONT)], 60));

  // 通用权限
  const generalPowers = [
    "代为调查取证、立案、提交证据和材料、出庭应诉；",
    "代为签收诉讼文书和法律文书、办理诉讼费的退费；",
    "代为申请财产保全、证据保全；",
  ];
  for (const p of generalPowers) {
    paras.push(xmlParagraph([xmlRun(p, false, FONT)], 40));
  }

  // 特别授权专属权限
  if (isSpecial) {
    const specialPowers = [
      "代为承认、放弃、变更诉讼请求；",
      "代为进行和解、提起反诉或者上诉。",
    ];
    for (const p of specialPowers) {
      paras.push(xmlParagraph([xmlRun(p, false, FONT)], 40));
    }
  }

  paras.push(xmlParagraph([xmlRun("", false, FONT)], 80));
  paras.push(xmlParagraph([xmlRun("特此委托。", false, FONT)], 60));

  // 签名区
  paras.push(xmlParagraph([xmlRun("", false, FONT)], 200));
  paras.push(xmlParagraph([xmlRun("委托人（盖章/签名/捺印）：", false, FONT)], 80, "right"));
  paras.push(xmlParagraph([xmlRun("年   月   日", false, FONT)], 80, "right"));

  // 律所信息
  paras.push(xmlParagraph([xmlRun("", false, FONT)], 160));
  paras.push(xmlParagraph([
    xmlRun(`${lawyer || "________"}律师，联系电话：________________`, false, FONT),
  ], 40));
  paras.push(xmlParagraph([
    xmlRun("地址：深圳市福田区莲花支路公交大厦六、七、十六层", false, FONT),
  ], 40));
}

function buildDocumentXml(templateName: string, data: CaseData, custom: Record<string, string>): string {
  const paras: string[] = [];
  const isAuth = templateName.includes("授权委托书");

  // Title
  paras.push(xmlParagraph([xmlRun(isAuth ? "授 权 委 托 书" : templateName, true, 18)], 200, "center"));
  paras.push(xmlParagraph([xmlRun("", false, FONT)], 80));

  if (!isAuth) {
    // Court
    if (data.court_name) {
      paras.push(xmlParagraph([xmlRun(data.court_name, false, FONT)], 120));
    }

    // Case info
    const infoItems: string[] = [];
    if (data.court_case_number) infoItems.push(`案号：${data.court_case_number}`);
    if (data.firm_case_number) infoItems.push(`律所编号：${data.firm_case_number}`);
    if (data.case_type) infoItems.push(`案由：${data.case_type}`);
    for (const item of infoItems) {
      paras.push(xmlParagraph([xmlRun(item, false, FONT)], 80));
    }

    paras.push(xmlParagraph([xmlRun("", false, FONT)], 120));

    // Parties
    if (data.plaintiff_name) {
      paras.push(xmlParagraph([xmlRun(`原告：${data.plaintiff_name}`, false, FONT)], 80));
    }
    if (data.defendant_name) {
      paras.push(xmlParagraph([xmlRun(`被告：${data.defendant_name}`, false, FONT)], 80));
    }

    paras.push(xmlParagraph([xmlRun("", false, FONT)], 120));
  }

  // Template-specific content
  if (templateName === "民事起诉状") {
    paras.push(xmlParagraph([xmlRun("诉讼请求：", true, FONT)], 80));
    paras.push(xmlParagraph([xmlRun(custom["诉讼请求"] || "（请在此填写诉讼请求）", false, FONT)], 120));
    paras.push(xmlParagraph([xmlRun("事实与理由：", true, FONT)], 80));
    paras.push(xmlParagraph([xmlRun(custom["事实与理由"] || "（请在此填写事实与理由）", false, FONT)], 120));
  } else if (templateName === "民事答辩状") {
    paras.push(xmlParagraph([xmlRun("答辩意见：", true, FONT)], 80));
    paras.push(xmlParagraph([xmlRun(custom["答辩意见"] || "（请在此填写答辩意见）", false, FONT)], 120));
    paras.push(xmlParagraph([xmlRun("事实与理由：", true, FONT)], 80));
    paras.push(xmlParagraph([xmlRun(custom["事实与理由"] || "（请在此填写事实与理由）", false, FONT)], 120));
  } else if (templateName === "授权委托书（一般授权）" || templateName === "授权委托书（特别授权）") {
    buildAuthorizationDoc(paras, templateName, data, custom);
  } else if (templateName === "代理词") {
    paras.push(xmlParagraph([xmlRun("代理意见：", true, FONT)], 80));
    paras.push(xmlParagraph([xmlRun(custom["代理意见"] || "（请在此填写代理意见）", false, FONT)], 120));
  }

  // Date
  paras.push(xmlParagraph([xmlRun("", false, FONT)], 200));
  paras.push(xmlParagraph([xmlRun(`日期：${new Date().toLocaleDateString("zh-CN")}`, false, FONT)], 80, "right"));

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>${paras.join("")}</w:body>
</w:document>`;

  return docXml;
}

// Minimal valid .docx requires: [Content_Types].xml, _rels/.rels, word/document.xml, word/_rels/document.xml.rels
const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const DOC_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

export async function getCaseDataForTemplate(caseId: number): Promise<{ data: CaseData | null; error?: string }> {
  const caseResult = await db
    .select()
    .from(cases)
    .where(and(eq(cases.id, caseId), notDeleted(cases)))
    .limit(1);

  if (caseResult.length === 0) return { data: null, error: "案件不存在" };

  const c = caseResult[0];

  const partiesResult = await db
    .select()
    .from(parties)
    .where(and(eq(parties.case_id, caseId), notDeleted(parties)));

  const plaintiff = partiesResult.find((p) => p.litigation_status?.includes("原告"));
  const defendant = partiesResult.find((p) => p.litigation_status?.includes("被告"));

  return {
    data: {
      court_case_number: c.court_case_number || "",
      firm_case_number: c.firm_case_number || "",
      case_type: c.case_type || "",
      court_name: c.court_name || "",
      plaintiff_name: plaintiff?.name || "",
      defendant_name: defendant?.name || "",
    },
  };
}

export function generateDocxFile(
  templateId: number,
  caseData: CaseData,
  customFields: Record<string, string>
): { buffer: Buffer; fileName: string } | { error: string } {
  const templateDef = TEMPLATES.find((t) => t.id === templateId);
  if (!templateDef) return { error: "模板不存在" };

  const docXml = buildDocumentXml(templateDef.name, caseData, customFields);

  const zip = new PizZip();
  zip.file("[Content_Types].xml", CONTENT_TYPES_XML);
  zip.file("_rels/.rels", RELS_XML);
  zip.file("word/document.xml", docXml);
  zip.file("word/_rels/document.xml.rels", DOC_RELS_XML);

  // Use docxtemplater to process (handles zip structure flattening)
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });
  // We don't use tags, just need docxtemplater to finalize the zip
  doc.render();

  const buffer = doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });
  const fileName = `${templateDef.name}_${caseData.court_case_number || "未命名"}.docx`;

  return { buffer: Buffer.from(buffer), fileName };
}
