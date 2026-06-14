export function formatPrice(price: number): string {
  return "Rp " + Math.round(price).toLocaleString("id-ID");
}
