const isValidDateString = (value) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const dailyRevenueReportValidator = (req) => {
  const errors = [];
  const { date } = req.query || {};

  if (typeof date !== "string" || !isValidDateString(date)) {
    errors.push({ field: "date", message: "date must be a valid date string" });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

const monthlyRevenueReportValidator = (req) => {
  const errors = [];
  const { year, month } = req.query || {};
  const parsedYear = Number(year);
  const parsedMonth = Number(month);

  if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 9999) {
    errors.push({ field: "year", message: "year must be a valid 4-digit year" });
  }

  if (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
    errors.push({ field: "month", message: "month must be an integer between 1 and 12" });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

const rangeRevenueReportValidator = (req) => {
  const errors = [];
  const { startDate, endDate } = req.query || {};

  if (typeof startDate !== "string" || !isValidDateString(startDate)) {
    errors.push({ field: "startDate", message: "startDate must be a valid date string" });
  }

  if (typeof endDate !== "string" || !isValidDateString(endDate)) {
    errors.push({ field: "endDate", message: "endDate must be a valid date string" });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = {
  dailyRevenueReportValidator,
  monthlyRevenueReportValidator,
  rangeRevenueReportValidator
};
