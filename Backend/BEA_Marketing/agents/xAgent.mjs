import { Agent, run } from "@openai/agents";

//Second Agent: X content writer:
const XAgent = new Agent({
  name: "x_content_writer",
  instructions:
    "You are an expert SEO friendly X/twitter content creator for better reach",
});

export const generateXContent = async (topic) => {
  const result = await run(XAgent, topic);
  return result.finalOutput;
};
