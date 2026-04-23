const { Invoice } = require("../models");
const ApiError = require("../utils/ApiError");

const PAYMENT_METHODS = ["cash", "card", "qr", "unknown"];

const formatDateKey = (date) => date.toISOString().slice(0, 10);

const getDayBounds = (dateInput) => {
  const date = new Date(dateInput);

  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, "Invalid date", "INVALID_REPORT_DATE");
  }

  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1, 0, 0, 0, 0));

  return { start, end };
};

const getMonthBounds = ({ year, month }) => {
  const parsedYear = Number(year);
  const parsedMonth = Number(month);

  if (!Number.isInteger(parsedYear) || !Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
    throw new ApiError(400, "Invalid year or month", "INVALID_REPORT_MONTH");
  }

  const start = new Date(Date.UTC(parsedYear, parsedMonth - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(parsedYear, parsedMonth, 1, 0, 0, 0, 0));

  return { start, end };
};

const getRangeBounds = ({ startDate, endDate }) => {
  const startBounds = getDayBounds(startDate);
  const endBounds = getDayBounds(endDate);
  const start = startBounds.start;
  const end = endBounds.end;

  if (end <= start) {
    throw new ApiError(400, "endDate must be later than or equal to startDate", "INVALID_REPORT_RANGE");
  }

  return { start, end };
};

const buildRevenueFacetPipeline = ({ start, end, includeDailySeries = false }) => {
  const summaryStages = [
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$grandTotal" },
        paidInvoiceCount: { $sum: 1 },
        sessionIds: { $addToSet: "$sessionId" }
      }
    },
    {
      $project: {
        _id: 0,
        totalRevenue: 1,
        paidInvoiceCount: 1,
        totalSessions: { $size: "$sessionIds" }
      }
    }
  ];

  const paymentBreakdownStages = [
    {
      $group: {
        _id: { $ifNull: ["$paymentMethod", "unknown"] },
        totalRevenue: { $sum: "$grandTotal" },
        paidInvoiceCount: { $sum: 1 },
        sessionIds: { $addToSet: "$sessionId" }
      }
    },
    {
      $project: {
        _id: 0,
        paymentMethod: "$_id",
        totalRevenue: 1,
        paidInvoiceCount: 1,
        totalSessions: { $size: "$sessionIds" }
      }
    },
    {
      $sort: { paymentMethod: 1 }
    }
  ];

  const facet = {
    summary: summaryStages,
    paymentMethodBreakdown: paymentBreakdownStages
  };

  if (includeDailySeries) {
    facet.dailyBreakdown = [
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$paidAt"
            }
          },
          totalRevenue: { $sum: "$grandTotal" },
          paidInvoiceCount: { $sum: 1 },
          sessionIds: { $addToSet: "$sessionId" }
        }
      },
      {
        $project: {
          _id: 0,
          date: "$_id",
          totalRevenue: 1,
          paidInvoiceCount: 1,
          totalSessions: { $size: "$sessionIds" }
        }
      },
      {
        $sort: { date: 1 }
      }
    ];
  }

  return [
    {
      $match: {
        paymentStatus: "paid",
        paidAt: {
          $gte: start,
          $lt: end
        }
      }
    },
    {
      $facet: facet
    }
  ];
};

const normalizePaymentBreakdown = (items = []) => {
  const map = new Map(
    PAYMENT_METHODS.map((paymentMethod) => [
      paymentMethod,
      {
        paymentMethod,
        totalRevenue: 0,
        paidInvoiceCount: 0,
        totalSessions: 0
      }
    ])
  );

  items.forEach((item) => {
    map.set(item.paymentMethod, {
      paymentMethod: item.paymentMethod,
      totalRevenue: item.totalRevenue,
      paidInvoiceCount: item.paidInvoiceCount,
      totalSessions: item.totalSessions
    });
  });

  return Array.from(map.values());
};

const normalizeRevenueAggregationResult = (result, { start, end, period, includeDailySeries = false }) => {
  const aggregation = result[0] || {};
  const summary = aggregation.summary?.[0] || {
    totalRevenue: 0,
    paidInvoiceCount: 0,
    totalSessions: 0
  };

  const normalized = {
    period,
    range: {
      startDate: formatDateKey(start),
      endDateExclusive: formatDateKey(end)
    },
    totalRevenue: summary.totalRevenue || 0,
    paidInvoiceCount: summary.paidInvoiceCount || 0,
    totalSessions: summary.totalSessions || 0,
    paymentMethodBreakdown: normalizePaymentBreakdown(aggregation.paymentMethodBreakdown || [])
  };

  if (includeDailySeries) {
    normalized.dailyBreakdown = aggregation.dailyBreakdown || [];
  }

  return normalized;
};

const getDailyRevenueReport = async ({ date }) => {
  const { start, end } = getDayBounds(date);
  const pipeline = buildRevenueFacetPipeline({ start, end });
  const result = await Invoice.aggregate(pipeline);

  return normalizeRevenueAggregationResult(result, {
    start,
    end,
    period: "daily"
  });
};

const getMonthlyRevenueReport = async ({ year, month }) => {
  const { start, end } = getMonthBounds({ year, month });
  const pipeline = buildRevenueFacetPipeline({ start, end, includeDailySeries: true });
  const result = await Invoice.aggregate(pipeline);

  return normalizeRevenueAggregationResult(result, {
    start,
    end,
    period: "monthly",
    includeDailySeries: true
  });
};

const getRangeRevenueReport = async ({ startDate, endDate }) => {
  const { start, end } = getRangeBounds({ startDate, endDate });
  const pipeline = buildRevenueFacetPipeline({ start, end });
  const result = await Invoice.aggregate(pipeline);

  return normalizeRevenueAggregationResult(result, {
    start,
    end,
    period: "range"
  });
};

module.exports = {
  PAYMENT_METHODS,
  formatDateKey,
  getDayBounds,
  getMonthBounds,
  getRangeBounds,
  buildRevenueFacetPipeline,
  normalizePaymentBreakdown,
  normalizeRevenueAggregationResult,
  getDailyRevenueReport,
  getMonthlyRevenueReport,
  getRangeRevenueReport
};
