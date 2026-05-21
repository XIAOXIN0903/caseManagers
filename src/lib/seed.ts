import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";

dotenv.config();

const dbUrl =
  process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "file:sqlite.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url: dbUrl, authToken });

async function seed() {
  console.log("Seeding database...");

  // -------------------- DROP TABLES --------------------
  await client.execute("DROP TABLE IF EXISTS communication_logs");
  await client.execute("DROP TABLE IF EXISTS reminders");
  await client.execute("DROP TABLE IF EXISTS fee_records");
  await client.execute("DROP TABLE IF EXISTS documents");
  await client.execute("DROP TABLE IF EXISTS case_progress");
  await client.execute("DROP TABLE IF EXISTS parties");
  await client.execute("DROP TABLE IF EXISTS document_templates");
  await client.execute("DROP TABLE IF EXISTS cases");

  // -------------------- CREATE TABLES --------------------
  await client.execute(`
    CREATE TABLE cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      court_case_number TEXT UNIQUE,
      firm_case_number TEXT UNIQUE,
      case_type TEXT,
      court_name TEXT,
      presiding_judge TEXT,
      judge_phone TEXT,
      judge_assistant TEXT,
      assistant_phone TEXT,
      filing_date TEXT,
      status TEXT DEFAULT '立案',
      claim_amount REAL,
      opposing_counsel TEXT,
      opposing_firm TEXT,
      opposing_phone TEXT,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      deleted_at TEXT
    )
  `);

  await client.execute(`
    CREATE TABLE parties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      litigation_status TEXT NOT NULL,
      phone TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      deleted_at TEXT
    )
  `);

  await client.execute(`
    CREATE TABLE case_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL,
      event_date TEXT NOT NULL,
      description TEXT
    )
  `);

  await client.execute(`
    CREATE TABLE documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      subcategory TEXT,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_size INTEGER,
      file_type TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `);

  await client.execute(`
    CREATE TABLE fee_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
      payment_status TEXT DEFAULT '未收',
      is_deposited INTEGER DEFAULT 0,
      amount REAL,
      invoice_url TEXT,
      received_date TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `);

  await client.execute(`
    CREATE TABLE reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      reminder_date TEXT NOT NULL,
      reminder_type TEXT DEFAULT '自定义',
      is_completed INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      deleted_at TEXT
    )
  `);

  await client.execute(`
    CREATE TABLE communication_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
      communication_date TEXT NOT NULL,
      method TEXT DEFAULT '电话',
      contact_person TEXT,
      summary TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      deleted_at TEXT
    )
  `);

  await client.execute(`
    CREATE TABLE document_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      file_url TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `);

  // -------------------- INDEXES --------------------
  const indexList = [
    "CREATE INDEX IF NOT EXISTS idx_cases_court_number ON cases(court_case_number)",
    "CREATE INDEX IF NOT EXISTS idx_cases_firm_number ON cases(firm_case_number)",
    "CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status)",
    "CREATE INDEX IF NOT EXISTS idx_cases_deleted ON cases(deleted_at)",
    "CREATE INDEX IF NOT EXISTS idx_parties_case_id ON parties(case_id)",
    "CREATE INDEX IF NOT EXISTS idx_parties_name ON parties(name)",
    "CREATE INDEX IF NOT EXISTS idx_parties_deleted ON parties(deleted_at)",
    "CREATE INDEX IF NOT EXISTS idx_progress_case_id ON case_progress(case_id)",
    "CREATE INDEX IF NOT EXISTS idx_progress_event_date ON case_progress(event_date)",
    "CREATE INDEX IF NOT EXISTS idx_documents_case_id ON documents(case_id)",
    "CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category)",
    "CREATE INDEX IF NOT EXISTS idx_fee_records_case_id ON fee_records(case_id)",
    "CREATE INDEX IF NOT EXISTS idx_reminders_case_id ON reminders(case_id)",
    "CREATE INDEX IF NOT EXISTS idx_reminders_date ON reminders(reminder_date)",
    "CREATE INDEX IF NOT EXISTS idx_reminders_completed ON reminders(is_completed)",
    "CREATE INDEX IF NOT EXISTS idx_reminders_deleted ON reminders(deleted_at)",
    "CREATE INDEX IF NOT EXISTS idx_comm_logs_case_id ON communication_logs(case_id)",
    "CREATE INDEX IF NOT EXISTS idx_comm_logs_date ON communication_logs(communication_date)",
    "CREATE INDEX IF NOT EXISTS idx_comm_logs_deleted ON communication_logs(deleted_at)",
  ];
  for (const idx of indexList) {
    await client.execute(idx);
  }

  // -------------------- SEED DATA --------------------
  const today = new Date().toISOString().split("T")[0];

  // Cases
  await client.execute({
    sql: `INSERT INTO cases (court_case_number, firm_case_number, case_type, court_name, presiding_judge, judge_phone, judge_assistant, assistant_phone, filing_date, status, claim_amount, opposing_counsel, opposing_firm, opposing_phone, description) VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      "(2026)粤0106民初1234号",
      "AL2026-001",
      "买卖合同纠纷",
      "广州市天河区人民法院",
      "张法官",
      "020-88886666",
      "李书记员",
      "020-88886667",
      "2026-03-15",
      "审理",
      250000,
      "王律师",
      "XX律师事务所",
      "13800001111",
      "原告主张被告未按合同约定支付货款25万元。",
    ],
  });

  await client.execute({
    sql: `INSERT INTO cases (court_case_number, firm_case_number, case_type, court_name, presiding_judge, judge_phone, filing_date, status, claim_amount, description) VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      "(2026)粤0305民初5678号",
      "AL2026-002",
      "劳动争议",
      "深圳市南山区人民法院",
      "陈法官",
      "0755-66668888",
      "2026-04-01",
      "立案",
      80000,
      "劳动争议仲裁已裁决，现起诉至法院。",
    ],
  });

  // Parties
  await client.execute({
    sql: `INSERT INTO parties (case_id, name, litigation_status, phone) VALUES
      (1, '李明', '原告', '13900002222'),
      (1, '王芳', '被告', '13600003333'),
      (2, '张伟', '申请人', '13700004444')`,
  });

  // Case progress
  await client.execute({
    sql: `INSERT INTO case_progress (case_id, event_type, event_date, description) VALUES
      (1, '立案', '2026-03-15', '在广州市天河区人民法院立案'),
      (1, '开庭', '2026-06-20', '第一次开庭，交换证据'),
      (2, '立案', '2026-04-01', '在深圳市南山区人民法院立案')`,
  });

  // Reminders
  await client.execute({
    sql: `INSERT INTO reminders (case_id, title, reminder_date, reminder_type, is_completed) VALUES
      (1, '开庭提醒', '2026-06-20', '开庭', 0),
      (1, '证据提交截止', '2026-06-10', '证据期限', 0),
      (2, '时效提醒', '2026-07-01', '时效提醒', 0)`,
  });

  // Communication logs
  await client.execute({
    sql: `INSERT INTO communication_logs (case_id, communication_date, method, contact_person, summary) VALUES
      (1, '2026-03-20', '电话', '李明', '与原告沟通证据收集事宜，对方表示会在本周内提供银行流水和合同复印件。'),
      (1, '2026-04-05', '微信', '王芳', '对方律师通过微信发送了答辩状，确认收到。'),
      (2, '2026-04-10', '面谈', '张伟', '到律所面谈，签署授权委托书和代理合同。')`,
  });

  // Fee records
  await client.execute({
    sql: `INSERT INTO fee_records (case_id, payment_status, is_deposited, amount, received_date, notes) VALUES
      (1, '已收', 1, 15000, '2026-03-10', '首期律师费'),
      (2, '未收', 0, 8000, NULL, '待收')`,
  });

  // Document templates (pre-defined)
  await client.execute({
    sql: `INSERT INTO document_templates (name, category, file_url) VALUES
      ('民事起诉状', '我方文书', NULL),
      ('民事答辩状', '我方文书', NULL),
      ('授权委托书', '我方文书', NULL),
      ('代理词', '我方文书', NULL)`,
  });

  console.log("Seed completed successfully.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
