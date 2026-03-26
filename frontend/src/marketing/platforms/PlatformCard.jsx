import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

const PlatformCard = ({
  icon,
  iconBg,
  title,
  badgeLabel,
  badgeBg,
  badgeColor,
  content,
  placeholder,
  charLabel,
}) => {
  const handleCopy = () => {
    if (content) {
      navigator.clipboard.writeText(content);
    }
  };

  return (
    <Box
      sx={{
        flex: 1,
        background: "#F6F7F8",
        borderRadius: "20px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        minWidth: 0,
      }}
    >
      {/* Card Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "10px",
            backgroundColor: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            fontSize: 18,
            fontWeight: 700,
          }}
        >
          {icon}
        </Box>
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A" }}>
          {title}
        </Typography>
        <Box
          sx={{
            padding: "4px 10px",
            borderRadius: "10px",
            backgroundColor: badgeBg,
          }}
        >
          <Typography
            sx={{ fontSize: 11, fontWeight: 600, color: badgeColor }}
          >
            {badgeLabel}
          </Typography>
        </Box>
      </Box>

      {/* Card Content */}
      <Typography
        sx={{
          fontSize: 13,
          color: content ? "#1A1A1A" : "#9CA3AF",
          lineHeight: 1.5,
          flex: 1,
        }}
      >
        {content || placeholder}
      </Typography>

      {/* Card Footer */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Tooltip title={content ? "Copy to clipboard" : ""}>
          <Box
            component="button"
            onClick={handleCopy}
            disabled={!content}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "10px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #F3F4F6",
              cursor: content ? "pointer" : "default",
              opacity: content ? 1 : 0.5,
              "&:hover": content
                ? { borderColor: "#D1D5DB" }
                : {},
            }}
          >
            <ContentCopyIcon sx={{ fontSize: 14, color: "#9CA3AF" }} />
            <Typography
              sx={{ fontSize: 12, fontWeight: 500, color: "#6B7280" }}
            >
              Copy
            </Typography>
          </Box>
        </Tooltip>
        <Typography sx={{ fontSize: 11, fontWeight: 500, color: "#9CA3AF" }}>
          {charLabel}
        </Typography>
      </Box>
    </Box>
  );
};

export default PlatformCard;
