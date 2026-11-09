//Shared Claude client for the feasibility automation (email intake, scope
//classification). CLAUDE_PROVIDER=anthropic | foundry. Without it, Foundry is
//used when its key is set.
const Anthropic = require("@anthropic-ai/sdk");
const { AnthropicFoundry } = require("@anthropic-ai/foundry-sdk");

let client = null;
const getClient = () => {
  if (client) return client;
  const provider =
    process.env.CLAUDE_PROVIDER ||
    (process.env.ANTHROPIC_FOUNDRY_API_KEY ? "foundry" : "anthropic");

  if (provider === "foundry") {
    if (!process.env.ANTHROPIC_FOUNDRY_API_KEY) {
      throw new Error("CLAUDE_PROVIDER=foundry but ANTHROPIC_FOUNDRY_API_KEY is not set");
    }
    client = new AnthropicFoundry({
      apiKey: process.env.ANTHROPIC_FOUNDRY_API_KEY,
      ...(process.env.ANTHROPIC_FOUNDRY_BASE_URL
        ? { baseURL: process.env.ANTHROPIC_FOUNDRY_BASE_URL }
        : { resource: process.env.ANTHROPIC_FOUNDRY_RESOURCE }),
    });
  } else if (process.env.ANTHROPIC_API_KEY) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  } else {
    throw new Error(
      "Set ANTHROPIC_FOUNDRY_API_KEY + ANTHROPIC_FOUNDRY_RESOURCE (Microsoft Foundry) or ANTHROPIC_API_KEY (Claude API)",
    );
  }
  return client;
};

module.exports = { getClient };
