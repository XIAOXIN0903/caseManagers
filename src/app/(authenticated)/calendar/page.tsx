"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Plus, Check, Trash2 } from "lucide-react";
import {
  getRemindersForMonth,
  createStandaloneReminder,
  updateStandaloneReminder,
  deleteStandaloneReminder,
} from "@/lib/actions/reminders";
import { REMINDER_TYPES } from "@/lib/case-constants";

type ReminderData = Awaited<
  ReturnType<typeof getRemindersForMonth>
>["data"] extends (infer R)[] | undefined
  ? R
  : never;

const typeColors: Record<string, string> = {
  "开庭": "bg-red-100 text-red-800",
  "证据期限": "bg-orange-100 text-orange-800",
  "上诉期限": "bg-purple-100 text-purple-800",
  "时效提醒": "bg-yellow-100 text-yellow-800",
  "自定义": "bg-blue-100 text-blue-800",
};

const DAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [reminders, setReminders] = useState<ReminderData[]>([]);
  const [loading, setLoading] = useState(true);

  // Add event dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  const [eventType, setEventType] = useState("自定义");
  const [eventNotes, setEventNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    const result = await getRemindersForMonth(year, month);
    if (result.success && result.data) setReminders(result.data);
    setLoading(false);
  }, [year, month]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  function prevMonth() {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else {
      setMonth(month + 1);
    }
  }

  function goToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
  }

  function openAddDialog(dateStr: string) {
    setSelectedDate(dateStr);
    setEventTitle("");
    setEventType("自定义");
    setEventNotes("");
    setDialogOpen(true);
  }

  async function handleAddEvent() {
    if (!eventTitle.trim()) {
      toast.error("请输入事项标题");
      return;
    }
    setSubmitting(true);
    const result = await createStandaloneReminder({
      title: eventTitle,
      reminder_date: selectedDate,
      reminder_type: eventType,
      notes: eventNotes || undefined,
    });
    if (result.success) {
      toast.success("已添加事项");
      setDialogOpen(false);
      fetchReminders();
    } else {
      toast.error(result.error || "添加失败");
    }
    setSubmitting(false);
  }

  async function handleToggleComplete(reminder: ReminderData) {
    const result = await updateStandaloneReminder(reminder.reminder.id, {
      title: reminder.reminder.title || "",
      reminder_date: reminder.reminder.reminder_date || "",
      reminder_type: reminder.reminder.reminder_type || "自定义",
      notes: reminder.reminder.notes || "",
      is_completed: reminder.reminder.is_completed === 1 ? 0 : 1,
    });
    if (result.success) {
      fetchReminders();
    } else {
      toast.error("操作失败");
    }
  }

  async function handleDelete(reminder: ReminderData) {
    if (!confirm("确定删除此事项？")) return;
    const result = await deleteStandaloneReminder(reminder.reminder.id);
    if (result.success) {
      toast.success("已删除");
      fetchReminders();
    } else {
      toast.error("删除失败");
    }
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayStr = today.toISOString().split("T")[0];

  function getRemindersForDay(day: number): ReminderData[] {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return reminders.filter(
      (r) => r.reminder.reminder_date === dateStr
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">日历</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium min-w-32 text-center">
            {year} 年 {month} 月
          </span>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToday}>
            今天
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground py-4">加载中...</p>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-b">
              {DAY_NAMES.map((name) => (
                <div
                  key={name}
                  className="py-2 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0"
                >
                  {name}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {cells.map((day, i) => {
                const dayReminders = day ? getRemindersForDay(day) : [];
                const dateStr = day
                  ? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                  : "";
                const isToday = dateStr === todayStr;

                return (
                  <div
                    key={i}
                    className={`min-h-[90px] sm:min-h-[110px] border-r border-b p-1 relative group ${
                      i % 7 === 6 ? "border-r-0" : ""
                    } ${!day ? "bg-muted/30" : "cursor-pointer hover:bg-accent/50"}`}
                    onClick={() => day && openAddDialog(dateStr)}
                  >
                    {day && (
                      <>
                        <div className="flex items-center justify-between">
                          <div
                            className={`text-xs font-medium mb-0.5 ${
                              isToday
                                ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
                                : "text-muted-foreground p-1"
                            }`}
                          >
                            {day}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAddDialog(dateStr);
                            }}
                            title="添加事项"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="space-y-0.5">
                          {dayReminders.slice(0, 3).map((r) => (
                            <div key={r.reminder.id} className="flex items-center gap-0.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleComplete(r);
                                }}
                                className="shrink-0"
                                title={r.reminder.is_completed ? "标记未完成" : "标记完成"}
                              >
                                <div
                                  className={`h-3 w-3 rounded border ${
                                    r.reminder.is_completed
                                      ? "bg-green-500 border-green-500 flex items-center justify-center"
                                      : "border-muted-foreground"
                                  }`}
                                >
                                  {r.reminder.is_completed === 1 && (
                                    <Check className="h-2 w-2 text-white" />
                                  )}
                                </div>
                              </button>
                              {r.reminder.case_id ? (
                                <Link
                                  href={`/cases/${r.reminder.case_id}`}
                                  className="block min-w-0 flex-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Badge
                                    className={`text-[10px] truncate w-full ${
                                      typeColors[r.reminder.reminder_type || "自定义"] || ""
                                    } ${r.reminder.is_completed ? "line-through opacity-50" : ""}`}
                                    variant="outline"
                                  >
                                    {r.reminder.title}
                                  </Badge>
                                </Link>
                              ) : (
                                <div className="min-w-0 flex-1 flex items-center gap-0.5">
                                  <span
                                    className={`text-[10px] truncate px-2 py-0.5 rounded-full border ${
                                      typeColors[r.reminder.reminder_type || "自定义"] || ""
                                    } ${r.reminder.is_completed ? "line-through opacity-50" : ""}`}
                                  >
                                    {r.reminder.title}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(r);
                                    }}
                                    className="shrink-0 opacity-0 group-hover:opacity-100"
                                    title="删除"
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                          {dayReminders.length > 3 && (
                            <p className="text-[10px] text-muted-foreground pl-4">
                              +{dayReminders.length - 3} 更多
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Event Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加事项 — {selectedDate}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="event-title">标题</Label>
              <Input
                id="event-title"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="例如：客户会议、开庭..."
              />
            </div>
            <div className="space-y-2">
              <Label>类型</Label>
              <Select value={eventType} onValueChange={(v) => setEventType(v || "自定义")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REMINDER_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="event-notes">备注</Label>
              <Textarea
                id="event-notes"
                value={eventNotes}
                onChange={(e) => setEventNotes(e.target.value)}
                rows={2}
                placeholder="可选"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleAddEvent} disabled={submitting}>
              {submitting ? "添加中..." : "添加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
