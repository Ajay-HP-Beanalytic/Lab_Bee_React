import { generateLinkedInContent } from "./agents/linkedInAgent.mjs";
import { generateXContent } from "./agents/xAgent.mjs";
import { generateFacebookContent } from "./agents/facebookAgent.mjs";
import { generateInstagramContent } from "./agents/instagramAgent.mjs";
import { generateWebsiteBlogContent } from "./agents/websiteBlogAgent.mjs";

export const generateAllContent = async (topic) => {
  const [linkedin, x, facebook, instagram, websiteBlog] = await Promise.all([
    generateLinkedInContent(topic),
    generateXContent(topic),
    generateFacebookContent(topic),
    generateInstagramContent(topic),
    generateWebsiteBlogContent(topic),
  ]);
  return { linkedin, x, facebook, instagram, websiteBlog };
};
