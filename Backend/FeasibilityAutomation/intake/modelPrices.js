// Approximate list prices in USD per million tokens, used only to estimate the
// cost of test runs. Check the provider's pricing page before relying on them.
// Cache writes are charged a little above the input price; that difference is
// ignored here.
const PRICES = {
  "claude-opus-5-5": { input: 4, output: 20 },
  "claude-sonnet-5-5": { input: 2, output: 10 },
};

//Total input tokens of one response, including the cached prompt.
const inputTokens = (usage) =>
  (usage?.input_tokens || 0) +
  (usage?.cache_creation_input_tokens || 0) +
  (usage?.cache_read_input_tokens || 0);

//Cost in USD, or null when the model's price is unknown.
const estimateCost = (model, input, output) => {
  const p = PRICES[model];
  return p ? (input * p.input + output * p.output) / 1e6 : null;
};

module.exports = { PRICES, inputTokens, estimateCost };
