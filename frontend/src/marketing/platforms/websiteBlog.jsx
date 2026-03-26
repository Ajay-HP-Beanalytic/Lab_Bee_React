import LanguageIcon from "@mui/icons-material/Language";
import PlatformCard from "./PlatformCard";

const WebsiteBlogContent = ({ content }) => {
  return (
    <PlatformCard
      icon={<LanguageIcon sx={{ fontSize: 18 }} />}
      iconBg="#10B981"
      title="Website Blog"
      badgeLabel="Long-form"
      badgeBg="#F0FDF4"
      badgeColor="#16A34A"
      content={content}
      placeholder="SEO-optimized blog article outlines and drafts will appear here."
      charLabel="~500 words"
    />
  );
};

export default WebsiteBlogContent;