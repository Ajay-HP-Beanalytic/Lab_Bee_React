import { Agent, run } from "@openai/agents";

//Second Agent: X content writer:
const WebsiteBlogAgent = new Agent({
  name: "website_blog_content_writer",
  instructions: "You are an expert SEO friendly website blog content writer.",
});

export const generateWebsiteBlogContent = async (topic) => {
  const result = await run(WebsiteBlogAgent, topic);
  return result.finalOutput;
};
