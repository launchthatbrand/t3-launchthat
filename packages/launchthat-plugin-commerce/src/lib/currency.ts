export function formatPrice(
  amount: number | null | undefined,
  {
    currency = "USD",
    divideBy = 100,
  }: { currency?: string; divideBy?: number } = {},
) {
  const normalizedAmount =
    typeof amount === "number" ? amount / (divideBy || 1) : 0;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(normalizedAmount);
}
