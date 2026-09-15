export function money(value: number, code: string, decimals = code === "OMR" ? 3 : 2) {
  return new Intl.NumberFormat("en", { style: "currency", currency: code, minimumFractionDigits: decimals }).format(value);
}

export function asNumber(value: unknown) {
  return Number(value ?? 0);
}

export function isoDate(value = new Date()) {
  return value.toISOString().slice(0, 10);
}

export function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_key, item) =>
    typeof item === "object" && item?.constructor?.name === "Decimal" ? Number(item) : item
  ));
}
