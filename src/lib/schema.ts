import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql, relations } from "drizzle-orm";

const timestamps = {
  created_at: text("created_at").default(sql`(datetime('now', 'localtime'))`),
  updated_at: text("updated_at").default(sql`(datetime('now', 'localtime'))`),
};

const softDelete = {
  deleted_at: text("deleted_at"),
};

const notDeleted = (table: { deleted_at: ReturnType<typeof text> }) =>
  sql`${table.deleted_at} IS NULL`;

// ============================================================
// 1. cases — 案件主表
// ============================================================
export const cases = sqliteTable("cases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  court_case_number: text("court_case_number").unique(),
  firm_case_number: text("firm_case_number").unique(),
  case_type: text("case_type"),
  court_name: text("court_name"),
  our_party: text("our_party"),
  opposing_party: text("opposing_party"),
  presiding_judge: text("presiding_judge"),
  judge_phone: text("judge_phone"),
  judge_assistant: text("judge_assistant"),
  assistant_phone: text("assistant_phone"),
  filing_date: text("filing_date"),
  status: text("status").default("立案"),
  claim_amount: real("claim_amount"),
  opposing_counsel: text("opposing_counsel"),
  opposing_firm: text("opposing_firm"),
  opposing_phone: text("opposing_phone"),
  description: text("description"),
  ...timestamps,
  ...softDelete,
});

export const casesRelations = relations(cases, ({ many }) => ({
  parties: many(parties),
  progress: many(caseProgress),
  documents: many(documents),
  feeRecords: many(feeRecords),
  reminders: many(reminders),
  communicationLogs: many(communicationLogs),
}));

// ============================================================
// 2. parties — 当事人
// ============================================================
export const parties = sqliteTable("parties", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  case_id: integer("case_id")
    .references(() => cases.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  litigation_status: text("litigation_status").notNull(),
  phone: text("phone"),
  notes: text("notes"),
  created_at: text("created_at").default(sql`(datetime('now', 'localtime'))`),
  ...softDelete,
});

export const partiesRelations = relations(parties, ({ one }) => ({
  case: one(cases, {
    fields: [parties.case_id],
    references: [cases.id],
  }),
}));

// ============================================================
// 3. case_progress — 案件进展
// ============================================================
export const caseProgress = sqliteTable("case_progress", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  case_id: integer("case_id")
    .references(() => cases.id, { onDelete: "cascade" })
    .notNull(),
  event_type: text("event_type").notNull(),
  event_date: text("event_date").notNull(),
  description: text("description"),
});

export const caseProgressRelations = relations(caseProgress, ({ one }) => ({
  case: one(cases, {
    fields: [caseProgress.case_id],
    references: [cases.id],
  }),
}));

// ============================================================
// 4. documents — 文档
// ============================================================
export const documents = sqliteTable("documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  case_id: integer("case_id")
    .references(() => cases.id, { onDelete: "cascade" })
    .notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  file_name: text("file_name").notNull(),
  file_url: text("file_url").notNull(),
  file_size: integer("file_size"),
  file_type: text("file_type"),
  created_at: text("created_at").default(sql`(datetime('now', 'localtime'))`),
});

export const documentsRelations = relations(documents, ({ one }) => ({
  case: one(cases, {
    fields: [documents.case_id],
    references: [cases.id],
  }),
}));

// ============================================================
// 5. fee_records — 收费记录
// ============================================================
export const feeRecords = sqliteTable("fee_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  case_id: integer("case_id")
    .references(() => cases.id, { onDelete: "cascade" })
    .notNull(),
  payment_status: text("payment_status").default("未收"),
  is_deposited: integer("is_deposited").default(0),
  amount: real("amount"),
  invoice_url: text("invoice_url"),
  received_date: text("received_date"),
  notes: text("notes"),
  created_at: text("created_at").default(sql`(datetime('now', 'localtime'))`),
});

export const feeRecordsRelations = relations(feeRecords, ({ one }) => ({
  case: one(cases, {
    fields: [feeRecords.case_id],
    references: [cases.id],
  }),
}));

// ============================================================
// 6. reminders — 提醒
// ============================================================
export const reminders = sqliteTable("reminders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  case_id: integer("case_id")
    .references(() => cases.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  reminder_date: text("reminder_date").notNull(),
  reminder_type: text("reminder_type").default("自定义"),
  is_completed: integer("is_completed").default(0),
  notes: text("notes"),
  created_at: text("created_at").default(sql`(datetime('now', 'localtime'))`),
  ...softDelete,
});

export const remindersRelations = relations(reminders, ({ one }) => ({
  case: one(cases, {
    fields: [reminders.case_id],
    references: [cases.id],
  }),
}));

// ============================================================
// 7. communication_logs — 沟通记录
// ============================================================
export const communicationLogs = sqliteTable("communication_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  case_id: integer("case_id")
    .references(() => cases.id, { onDelete: "cascade" })
    .notNull(),
  communication_date: text("communication_date").notNull(),
  method: text("method").default("电话"),
  contact_person: text("contact_person"),
  summary: text("summary"),
  created_at: text("created_at").default(sql`(datetime('now', 'localtime'))`),
  ...softDelete,
});

export const communicationLogsRelations = relations(
  communicationLogs,
  ({ one }) => ({
    case: one(cases, {
      fields: [communicationLogs.case_id],
      references: [cases.id],
    }),
  })
);

// ============================================================
// 8. document_templates — 文书模板（预置数据，无软删除）
// ============================================================
export const documentTemplates = sqliteTable("document_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  file_url: text("file_url"),
  created_at: text("created_at").default(sql`(datetime('now', 'localtime'))`),
});

// ============================================================
// 索引导出
// ============================================================
export const indexes = {
  // cases
  idx_cases_court_number: sql`CREATE INDEX IF NOT EXISTS idx_cases_court_number ON cases(court_case_number)`,
  idx_cases_firm_number: sql`CREATE INDEX IF NOT EXISTS idx_cases_firm_number ON cases(firm_case_number)`,
  idx_cases_status: sql`CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status)`,
  idx_cases_deleted: sql`CREATE INDEX IF NOT EXISTS idx_cases_deleted ON cases(deleted_at)`,

  // parties
  idx_parties_case_id: sql`CREATE INDEX IF NOT EXISTS idx_parties_case_id ON parties(case_id)`,
  idx_parties_name: sql`CREATE INDEX IF NOT EXISTS idx_parties_name ON parties(name)`,
  idx_parties_deleted: sql`CREATE INDEX IF NOT EXISTS idx_parties_deleted ON parties(deleted_at)`,

  // case_progress
  idx_progress_case_id: sql`CREATE INDEX IF NOT EXISTS idx_progress_case_id ON case_progress(case_id)`,
  idx_progress_event_date: sql`CREATE INDEX IF NOT EXISTS idx_progress_event_date ON case_progress(event_date)`,

  // documents
  idx_documents_case_id: sql`CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents(case_id)`,
  idx_documents_category: sql`CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category)`,

  // fee_records
  idx_fee_records_case_id: sql`CREATE INDEX IF NOT EXISTS idx_fee_records_case_id ON fee_records(case_id)`,

  // reminders
  idx_reminders_case_id: sql`CREATE INDEX IF NOT EXISTS idx_reminders_case_id ON reminders(case_id)`,
  idx_reminders_date: sql`CREATE INDEX IF NOT EXISTS idx_reminders_date ON reminders(reminder_date)`,
  idx_reminders_completed: sql`CREATE INDEX IF NOT EXISTS idx_reminders_completed ON reminders(is_completed)`,
  idx_reminders_deleted: sql`CREATE INDEX IF NOT EXISTS idx_reminders_deleted ON reminders(deleted_at)`,

  // communication_logs
  idx_comm_logs_case_id: sql`CREATE INDEX IF NOT EXISTS idx_comm_logs_case_id ON communication_logs(case_id)`,
  idx_comm_logs_date: sql`CREATE INDEX IF NOT EXISTS idx_comm_logs_date ON communication_logs(communication_date)`,
  idx_comm_logs_deleted: sql`CREATE INDEX IF NOT EXISTS idx_comm_logs_deleted ON communication_logs(deleted_at)`,
};

// 软删除过滤辅助
export { notDeleted };
