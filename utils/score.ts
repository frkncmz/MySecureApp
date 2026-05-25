/**
 * Calculate evaluation score from question answers.
 * Each answer has a sentiment: good (+1), neutral (0), bad (-1).
 * Score is normalized to 0-10 range.
 */
export function calculateEvaluationScore(
  sentiments: Array<'good' | 'neutral' | 'bad'>
): number {
  if (sentiments.length === 0) return 5.0;

  const good = sentiments.filter(s => s === 'good').length;
  const bad = sentiments.filter(s => s === 'bad').length;
  const total = sentiments.length;

  const rawScore = (good - bad) / total; // [-1, +1]
  const normalized = ((rawScore + 1) / 2) * 10; // [0, 10]
  return Math.round(normalized * 10) / 10;
}

/**
 * Calculate the new overall score using rolling average.
 * new_score = (old_score * total_ratings + new_score) / (total_ratings + 1)
 */
export function calculateUpdatedScore(
  currentScore: number,
  totalRatings: number,
  newScore: number
): number {
  if (totalRatings === 0) return newScore;
  const updated = (currentScore * totalRatings + newScore) / (totalRatings + 1);
  return Math.round(updated * 10) / 10;
}
