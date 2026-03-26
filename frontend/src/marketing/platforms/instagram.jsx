import CameraAltIcon from "@mui/icons-material/CameraAlt";
import PlatformCard from "./PlatformCard";

const InstagramContent = ({ content }) => {
  return (
    <PlatformCard
      icon={<CameraAltIcon sx={{ fontSize: 18 }} />}
      iconBg="#E4405F"
      title="Instagram"
      badgeLabel="Visual"
      badgeBg="#FDF2F8"
      badgeColor="#E4405F"
      content={content}
      placeholder="Caption ideas and hashtag strategies for Instagram will appear here."
      charLabel="~200 chars"
    />
  );
};

export default InstagramContent;