// Traffic-light thresholds for song scores, matching the web app: red ≤ 33,
// amber ≤ 66, green above.
export function ratingTextClass(rating: number): string {
  if (rating <= 33) return "text-destructive";
  if (rating <= 66) return "text-chart-3";
  return "text-success";
}

export function ratingBgClass(rating: number): string {
  if (rating <= 33) return "bg-destructive";
  if (rating <= 66) return "bg-chart-3";
  return "bg-success";
}
