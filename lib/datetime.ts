const LOCAL_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,6})?)?$/;

export function toApiLocalDateTime(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(LOCAL_DATE_TIME_PATTERN);
  if (match) {
    const [, year, month, day, hour, minute, second] = match;
    return `${year}-${month}-${day}T${hour}:${minute}:${second ?? "00"}`;
  }

  return trimmed;
}

function localDateTimeTimestamp(value?: string | null) {
  if (!value) return null;
  const normalized = toApiLocalDateTime(value);
  const match = normalized?.match(LOCAL_DATE_TIME_PATTERN);
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match;
  const timestamp = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second ?? "0")
  );

  return Number.isNaN(timestamp) ? null : timestamp;
}

export function parseLocalDateTime(value?: string | null) {
  const timestamp = localDateTimeTimestamp(value);
  return timestamp === null ? null : new Date(timestamp);
}

export function compareLocalDateTimes(
  first?: string | null,
  second?: string | null
) {
  const firstTimestamp = localDateTimeTimestamp(first);
  const secondTimestamp = localDateTimeTimestamp(second);

  if (firstTimestamp === null || secondTimestamp === null) {
    return null;
  }

  return firstTimestamp - secondTimestamp;
}

function getTimeZoneParts(value: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

/** Converte um timestamp da API para o valor esperado por datetime-local. */
export function toDateTimeLocalValue(
  value?: string | null,
  timeZone = "America/Belem"
) {
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value}T00:00`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    const local = toApiLocalDateTime(value);
    return local ? local.slice(0, 16) : "";
  }

  try {
    const parts = getTimeZoneParts(parsed, timeZone);
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  } catch {
    const local = toApiLocalDateTime(value);
    return local ? local.slice(0, 16) : "";
  }
}
