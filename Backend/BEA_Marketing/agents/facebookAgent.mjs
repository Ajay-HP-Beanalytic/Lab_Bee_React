import { Agent, run } from "@openai/agents";

// Agent LinkedIn content writer:
const FacebookAgent = new Agent({
  name: "facebook_content_writer",
  instructions: "You are an expert Facebook content creator",
});

export const generateFacebookContent = async (topic) => {
  const result = await run(FacebookAgent, topic);
  return result.finalOutput;
};
