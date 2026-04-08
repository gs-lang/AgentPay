/**
 * Agent B — Worker Agent
 *
 * This agent provides a text-summarization service.
 * It charges $0.05 per summary via AgentPay.
 *
 * In a real system, Agent B would run as a separate service.
 * For this demo, we import it and call it directly from main.js.
 */

const SUMMARIZATION_FEE = 0.05; // USD per summary

/**
 * Summarize the given text.
 * Returns the summary and the fee charged.
 *
 * @param {string} text - Text to summarize
 * @returns {{ summary: string, fee: number }}
 */
export function summarize(text) {
  // Simple extractive summary: take first sentence + word count
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const firstSentence = sentences[0]?.trim() ?? text;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const summary = `${firstSentence}. [${wordCount} words total]`;

  return { summary, fee: SUMMARIZATION_FEE };
}
