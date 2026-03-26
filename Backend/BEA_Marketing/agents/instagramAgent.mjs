import { Agent, run } from "@openai/agents";

// Agent LinkedIn content writer:
const InstagramAgent = new Agent({
  name: "instagram_content_writer",
  instructions: "You are an expert SEO friendly Instagram content creator",
});

export const generateInstagramContent = async (topic) => {
  const result = await run(InstagramAgent, topic);
  return result.finalOutput;
};
