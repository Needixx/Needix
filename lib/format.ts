export const fmtCurrency = (n: number, currency = "USD") =>
  new Intl.NumberFormat(undefined, { style: "currency", currency }).format(n);
