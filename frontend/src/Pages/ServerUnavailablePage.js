import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

export default function ServerUnavailablePage({ onRetry }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 3,
        background:
          "linear-gradient(135deg, #061a40 0%, #0b3d91 45%, #0f6ab4 100%)",
      }}
    >
      <Card
        sx={{
          maxWidth: 520,
          width: "100%",
          borderRadius: 3,
          boxShadow: "0 18px 60px rgba(0,0,0,0.25)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: "#0b2545", mb: 2 }}
          >
            Server Unavailable
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary", mb: 1.5 }}>
            Lab Bee cannot reach the server right now.
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
            This is usually temporary. Please wait a moment and try again. If
            the problem continues, contact the administrator.
          </Typography>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={onRetry}
            size="large"
          >
            Retry Connection
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
