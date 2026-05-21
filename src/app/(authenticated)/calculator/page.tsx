"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Guangdong lawyer fee brackets
const lawyerFeeBrackets = [
  { min: 0, max: 100000, rate: 0, base: 8000, description: "0 ~ 10万（最低 8,000 元）" },
  { min: 100000, max: 500000, rate: 0.06, base: 8000, formula: "(标的额-10万)×6% + 8,000" },
  { min: 500000, max: 1000000, rate: 0.05, base: 32000, formula: "(标的额-50万)×5% + 32,000" },
  { min: 1000000, max: 5000000, rate: 0.04, base: 57000, formula: "(标的额-100万)×4% + 57,000" },
  { min: 5000000, max: 10000000, rate: 0.03, base: 217000, formula: "(标的额-500万)×3% + 217,000" },
  { min: 10000000, max: 20000000, rate: 0.02, base: 367000, formula: "(标的额-1000万)×2% + 367,000" },
  { min: 20000000, max: 50000000, rate: 0.01, base: 567000, formula: "(标的额-2000万)×1% + 567,000" },
  { min: 50000000, max: Infinity, rate: 0.005, base: 867000, formula: "(标的额-5000万)×0.5% + 867,000" },
];

// Court fee brackets (国务院令第 481 号)
const courtFeeBrackets = [
  { min: 0, max: 10000, rate: 0, fixed: 50, description: "0 ~ 1万（固定 50 元）" },
  { min: 10000, max: 100000, rate: 0.025, description: "1万 ~ 10万 2.5%" },
  { min: 100000, max: 200000, rate: 0.02, description: "10万 ~ 20万 2%" },
  { min: 200000, max: 500000, rate: 0.015, description: "20万 ~ 50万 1.5%" },
  { min: 500000, max: 1000000, rate: 0.01, description: "50万 ~ 100万 1%" },
  { min: 1000000, max: 2000000, rate: 0.009, description: "100万 ~ 200万 0.9%" },
  { min: 2000000, max: 5000000, rate: 0.008, description: "200万 ~ 500万 0.8%" },
  { min: 5000000, max: 10000000, rate: 0.007, description: "500万 ~ 1000万 0.7%" },
  { min: 10000000, max: 20000000, rate: 0.006, description: "1000万 ~ 2000万 0.6%" },
  { min: 20000000, max: Infinity, rate: 0.005, description: "2000万以上 0.5%" },
];

function calcLawyerFee(amount: number): number {
  if (!amount || amount <= 0) return 0;
  for (const b of lawyerFeeBrackets) {
    if (amount <= b.max) {
      if (amount <= 100000) return b.base;
      return b.rate * (amount - b.min) + b.base;
    }
  }
  return 0;
}

function calcCourtFee(amount: number): number {
  if (!amount || amount <= 0) return 0;

  let remaining = amount;
  let total = 0;

  for (const b of courtFeeBrackets) {
    if (remaining <= 0) break;
    const segmentMax = b.max === Infinity ? remaining : b.max;
    const segmentMin = b.min;
    const segmentAmount = Math.min(remaining, segmentMax - segmentMin);

    if (segmentAmount > 0) {
      if (b.fixed) {
        total = b.fixed;
        remaining = 0;
      } else {
        total += segmentAmount * b.rate;
        remaining -= segmentAmount;
      }
    }
  }

  return Math.round(total * 100) / 100;
}

function formatMoney(n: number): string {
  return `¥${n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CalculatorPage() {
  const [amount, setAmount] = useState<string>("");

  const amt = parseFloat(amount) || 0;
  const lawyerFee = calcLawyerFee(amt);
  const courtFee = calcCourtFee(amt);
  const totalFee = lawyerFee + courtFee;

  const activeLawyerBracket = lawyerFeeBrackets.find(
    (b) => amt > b.min && amt <= b.max
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold">费用计算器</h1>

      {/* Input */}
      <Card>
        <CardContent className="py-4">
          <div className="space-y-2 max-w-sm">
            <Label htmlFor="claim-amount">标的额（元）</Label>
            <Input
              id="claim-amount"
              type="number"
              placeholder="请输入标的额"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {amt > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-sm text-muted-foreground">律师费</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatMoney(lawyerFee)}
                </p>
                {activeLawyerBracket?.formula && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {activeLawyerBracket.formula}
                  </p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-sm text-muted-foreground">诉讼费</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatMoney(courtFee)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-sm text-muted-foreground">合计</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatMoney(totalFee)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Lawyer fee detail table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">律师费收费标准（广东省）</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">标的额</th>
                      <th className="text-right py-2 font-medium">费率</th>
                      <th className="text-right py-2 font-medium">费用</th>
                      <th className="text-right py-2 font-medium hidden sm:table-cell">
                        速算公式
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lawyerFeeBrackets.map((b, i) => {
                      const bracketAmt =
                        amt > b.min ? Math.min(amt, b.max) - b.min : 0;
                      const isActive = amt > b.min && amt <= b.max;
                      const feeForBracket =
                        i === 0 && amt <= 100000
                          ? 8000
                          : b.rate * Math.max(0, amt - b.min) + b.base - b.base;
                      return (
                        <tr
                          key={i}
                          className={`border-b last:border-0 ${isActive ? "bg-muted/50 font-medium" : ""}`}
                        >
                          <td className="py-2">{b.description}</td>
                          <td className="text-right py-2">
                            {b.rate ? `${(b.rate * 100).toFixed(1)}%` : "—"}
                          </td>
                          <td className="text-right py-2">
                            {amt > b.min || (i === 0 && amt > 0)
                              ? formatMoney(
                                  i === 0 && amt <= 100000
                                    ? 8000
                                    : (b.rate || 0) * Math.min(amt, b.max) +
                                        b.base
                                )
                              : "—"}
                          </td>
                          <td className="text-right py-2 text-muted-foreground hidden sm:table-cell text-xs">
                            {b.formula || "最低 8,000 元"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Court fee detail table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                诉讼费收费标准（国务院令第 481 号）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">标的额</th>
                      <th className="text-right py-2 font-medium">费率</th>
                      <th className="text-right py-2 font-medium">分段计算</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courtFeeBrackets.map((b, i) => {
                      const segmentStart = b.min;
                      const segmentEnd = b.max === Infinity ? amt : b.max;
                      const segmentAmt =
                        amt > segmentStart
                          ? Math.min(amt, segmentEnd) - segmentStart
                          : 0;
                      const feeForSegment =
                        b.fixed && amt <= 10000
                          ? b.fixed
                          : b.rate * Math.max(0, segmentAmt);

                      return (
                        <tr
                          key={i}
                          className={`border-b last:border-0 ${
                            segmentAmt > 0 ? "bg-muted/50" : ""
                          }`}
                        >
                          <td className="py-2">{b.description}</td>
                          <td className="text-right py-2">
                            {b.fixed
                              ? `固定 ¥${b.fixed}`
                              : `${(b.rate * 100).toFixed(1)}%`}
                          </td>
                          <td className="text-right py-2">
                            {segmentAmt > 0
                              ? formatMoney(feeForSegment)
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="font-medium">
                      <td className="py-2">合计</td>
                      <td className="text-right py-2" />
                      <td className="text-right py-2">{formatMoney(courtFee)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!amt && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            请输入标的额查看计算结果
          </CardContent>
        </Card>
      )}
    </div>
  );
}
