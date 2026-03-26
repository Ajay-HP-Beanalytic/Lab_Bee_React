import PlatformCard from "./PlatformCard";

const FacebookContent = ({ content }) => {
  return (
    <PlatformCard
      icon="f"
      iconBg="#1877F2"
      title="Facebook"
      badgeLabel="Community"
      badgeBg="#EFF6FF"
      badgeColor="#1877F2"
      content={content}
      placeholder="Engaging Facebook posts designed to spark conversations will appear here."
      charLabel="~300 chars"
    />
  );
};

export default FacebookContent;