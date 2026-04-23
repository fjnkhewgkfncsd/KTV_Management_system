const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildRevenueFacetPipeline,
  getDayBounds,
  getMonthBounds,
  getRangeBounds,
  normalizePaymentBreakdown,
  normalizeRevenueAggregationResult
} = require("../src/services/report.service");

test("getDayBounds returns inclusive day start and exclusive next day", () => {
  const { start, end } = getDayBounds("2026-04-21");

  assert.equal(start.toISOString(), "2026-04-21T00:00:00.000Z");
  assert.equal(end.toISOString(), "2026-04-22T00:00:00.000Z");
});

test("getMonthBounds returns month start and next month start", () => {
  const { start, end } = getMonthBounds({ year: "2026", month: "4" });

  assert.equal(start.toISOString(), "2026-04-01T00:00:00.000Z");
  assert.equal(end.toISOString(), "2026-05-01T00:00:00.000Z");
});

test("getRangeBounds expands endDate to exclusive next day", () => {
  const { start, end } = getRangeBounds({ startDate: "2026-04-01", endDate: "2026-04-03" });

  assert.equal(start.toISOString(), "2026-04-01T00:00:00.000Z");
  assert.equal(end.toISOString(), "2026-04-04T00:00:00.000Z");
});

test("buildRevenueFacetPipeline matches paid invoices by paidAt", () => {
  const start = new Date("2026-04-21T00:00:00.000Z");
  const end = new Date("2026-04-22T00:00:00.000Z");
  const pipeline = buildRevenueFacetPipeline({ start, end, includeDailySeries: true });

  assert.equal(pipeline[0].$match.paymentStatus, "paid");
  assert.equal(pipeline[0].$match.paidAt.$gte.toISOString(), start.toISOString());
  assert.equal(pipeline[0].$match.paidAt.$lt.toISOString(), end.toISOString());
  assert.ok(Array.isArray(pipeline[1].$facet.dailyBreakdown));
});

test("normalizePaymentBreakdown fills missing payment methods", () => {
  const breakdown = normalizePaymentBreakdown([
    {
      paymentMethod: "cash",
      totalRevenue: 1000,
      paidInvoiceCount: 2,
      totalSessions: 2
    }
  ]);

  assert.equal(breakdown.length, 4);
  assert.deepEqual(
    breakdown.find((item) => item.paymentMethod === "card"),
    {
      paymentMethod: "card",
      totalRevenue: 0,
      paidInvoiceCount: 0,
      totalSessions: 0
    }
  );
});

test("normalizeRevenueAggregationResult maps aggregation output", () => {
  const report = normalizeRevenueAggregationResult(
    [
      {
        summary: [
          {
            totalRevenue: 1540,
            paidInvoiceCount: 3,
            totalSessions: 3
          }
        ],
        paymentMethodBreakdown: [
          {
            paymentMethod: "cash",
            totalRevenue: 1000,
            paidInvoiceCount: 2,
            totalSessions: 2
          },
          {
            paymentMethod: "qr",
            totalRevenue: 540,
            paidInvoiceCount: 1,
            totalSessions: 1
          }
        ],
        dailyBreakdown: [
          {
            date: "2026-04-01",
            totalRevenue: 500,
            paidInvoiceCount: 1,
            totalSessions: 1
          }
        ]
      }
    ],
    {
      start: new Date("2026-04-01T00:00:00.000Z"),
      end: new Date("2026-05-01T00:00:00.000Z"),
      period: "monthly",
      includeDailySeries: true
    }
  );

  assert.equal(report.period, "monthly");
  assert.equal(report.totalRevenue, 1540);
  assert.equal(report.paidInvoiceCount, 3);
  assert.equal(report.totalSessions, 3);
  assert.equal(report.dailyBreakdown.length, 1);
});
