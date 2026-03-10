import { Agent, run } from "@openai/agents";

// Agent LinkedIn content writer:
const LinkedInAgent = new Agent({
  name: "linkedin_content_writer",
  instructions:
    "You are an expert SEO friendly LinkedIn content creator for better reach in 200 words",
});

export const generateLinkedInContent = async (topic) => {
  const result = await run(LinkedInAgent, topic);
  return result.finalOutput;
};
