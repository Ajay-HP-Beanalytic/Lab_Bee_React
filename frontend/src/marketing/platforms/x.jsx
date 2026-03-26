import PlatformCard from "./PlatformCard";

const XContent = ({ content }) => {
  return (
    <PlatformCard
      icon="X"
      iconBg="#1A1A1A"
      title="X (Twitter)"
      badgeLabel="Concise"
      badgeBg="#F3F4F6"
      badgeColor="#1A1A1A"
      content={content}
      placeholder="Snappy, engaging tweets crafted by AI to maximize impressions will appear here."
      charLabel="~280 chars"
    />
  );
};

export default XContent;
