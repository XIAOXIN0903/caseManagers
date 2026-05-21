"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getRemindersForMonth } from "@/lib/actions/reminders";

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
            {/* Day headers */}
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

            {/* Calendar grid */}
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
                    className={`min-h-[80px] sm:min-h-[100px] border-r border-b p-1 ${
                      i % 7 === 6 ? "border-r-0" : ""
                    } ${!day ? "bg-muted/30" : ""}`}
                  >
                    {day && (
                      <>
                        <div
                          className={`text-xs font-medium mb-0.5 ${
                            isToday
                              ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
                              : "text-muted-foreground p-1"
                          }`}
                        >
                          {day}
                        </div>
                        <div className="space-y-0.5">
                          {dayReminders.slice(0, 3).map((r) => (
                            <Link
                              key={r.reminder.id}
                              href={`/cases/${r.reminder.case_id}`}
                              className="block"
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
                          ))}
                          {dayReminders.length > 3 && (
                            <p className="text-[10px] text-muted-foreground">
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
    </div>
  );
}
