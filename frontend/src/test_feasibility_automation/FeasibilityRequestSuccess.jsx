import { useSearchParams } from "react-router-dom";
import { Box, Button, Card, CardContent, Typography } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EmailIcon from "@mui/icons-material/Email";
import beanalyticLogo from "../images/BeanalyticLogo.jpg";

export default function FeasibilityRequestSuccess() {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("ref") || "";
  const email = searchParams.get("email") || "";

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ bgcolor: "#f5f7fa", px: 2 }}
    >
      <Card sx={{ maxWidth: 520, width: "100%", borderRadius: 3, boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
        <CardContent sx={{ p: { xs: 3, sm: 5 }, textAlign: "center" }}>
          <img
            src={beanalyticLogo}
            alt="BE Analytic"
            style={{ height: 48, marginBottom: 24 }}
          />

          <CheckCircleOutlineIcon
            sx={{ fontSize: 64, color: "success.main", mb: 2 }}
          />

          <Typography variant="h5" fontWeight={700} gutterBottom>
            Request Submitted!
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Thank you for your test feasibility request. Our team will review it
            and get back to you shortly.
          </Typography>

          {reference && (
            <Box
              sx={{
                bgcolor: "#e8f5e9",
                border: "1px solid #a5d6a7",
                borderRadius: 2,
                px: 3,
                py: 2,
                mb: 3,
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block">
                Your Reference Number
              </Typography>
              <Typography variant="h6" fontWeight={700} color="success.dark">
                {reference}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Quote this in all communications with us.
              </Typography>
            </Box>
          )}

          {email && (
            <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={3}>
              <EmailIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                A confirmation email has been sent to <strong>{email}</strong>
              </Typography>
            </Box>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Our typical review time is <strong>2–4 hours</strong> for standard
            requests. You will receive a feasibility report and quotation at your
            email once it is ready.
          </Typography>

          <Button
            variant="outlined"
            href="mailto:info@beanalytic.com"
            size="small"
          >
            Contact Us
          </Button>

          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            mt={4}
          >
            © {new Date().getFullYear()} BE Analytic Laboratories · NABL Accredited
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}