const LOCAL_DATE_TIME_PATTERN = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2})(?:\.\d{1,6})?)?$/;

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
    const [, date, hoursAndMinutes, seconds] = match;
    return `${date}T${hoursAndMinutes}:${seconds ?? "00"}`;
  }

  return trimmed;
}

export function parseLocalDateTime(value?: string | null) {
  if (!value) {
    return null;
  }

  const normalized = toApiLocalDateTime(value);
  if (!normalized) {
    return null;
  }

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function compareLocalDateTimes(
  first?: string | null,
  second?: string | null
) {
  const firstDate = parseLocalDateTime(first);
  const secondDate = parseLocalDateTime(second);

  if (!firstDate || !secondDate) {
    return null;
  }

  return firstDate.getTime() - secondDate.getTime();
}
