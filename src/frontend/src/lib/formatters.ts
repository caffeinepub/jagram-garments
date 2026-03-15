export function formatPrice(priceCents: bigint): string {
  const amount = Number(priceCents) / 100;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatDate(time: bigint): string {
  const ms = Number(time) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
