export const REPORTING_TIME_ZONE = "America/Chicago";

const reportingDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: REPORTING_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const reportingDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: REPORTING_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export function toReportingDate(date = new Date()) {
  const parts = Object.fromEntries(
    reportingDateFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function reportingParts(date) {
  return Object.fromEntries(
    reportingDateTimeFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  );
}

export function reportingDateStartInstant(date) {
  const [year, month, day] = date.split("-").map(Number);
  const desiredAsUtc = Date.UTC(year, month - 1, day);
  let instant = new Date(desiredAsUtc);

  for (let attempt = 0; attempt < 2; attempt++) {
    const actual = reportingParts(instant);
    const actualAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second
    );
    instant = new Date(instant.getTime() + desiredAsUtc - actualAsUtc);
  }

  return instant;
}
