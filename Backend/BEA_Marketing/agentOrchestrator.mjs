import { generateLinkedInContent } from "./agents/linkedinAgent.mjs";
import { generateXContent } from "./agents/xAgent.mjs";

export const generateAllContent = async (topic) => {
  const [linkedin, x] = await Promise.all([
    generateLinkedInContent(topic),
    generateXContent(topic),
  ]);
  return { linkedin, x };
};
