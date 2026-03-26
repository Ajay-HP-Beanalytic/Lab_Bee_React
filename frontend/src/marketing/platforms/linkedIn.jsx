import PlatformCard from "./PlatformCard";

const LinkedInContent = ({ content }) => {
  return (
    <PlatformCard
      icon="in"
      iconBg="#0A66C2"
      title="LinkedIn"
      badgeLabel="Professional"
      badgeBg="#EFF6FF"
      badgeColor="#0A66C2"
      content={content}
      placeholder="AI-generated professional content for your LinkedIn audience will appear here."
      charLabel="~250 chars"
    />
  );
};

export default LinkedInContent;
