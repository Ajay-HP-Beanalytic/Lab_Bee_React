import { useEffect, useState } from "react";
import axios from "axios";
import { Link as RouterLink, useParams } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, Divider, Link, Paper, Stack, Typography } from "@mui/material";
import VerifiedIcon from "@mui/icons-material/Verified";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import dayjs from "dayjs";
import { serverBaseAddress } from "../../Pages/APIPage";
import BEA_LOGO from "../../Reports/BEA_LOGO.png";

// The page behind the QR code on a final report: report number, issue date, whether it is
// still the current issue, and the PDF. No login; the link itself is the key.
export default function PublicReportPage() {
  const { token } = useParams();
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Test report - BE Analytic";
    axios
      .get(`${serverBaseAddress}/api/public/reports/${encodeURIComponent(token || "")}`, { withCredentials: false })
      .then((r) => setInfo(r.data))
      .catch((e) => setError(e.response?.data?.error || "This report could not be found."));
  }, [token]);

  const pdf = (download) =>
    `${serverBaseAddress}/api/public/reports/${encodeURIComponent(token)}/pdf${download ? "?download=1" : ""}`;
  const date = (d) => (d ? dayjs(d).format("DD MMM YYYY") : "-");

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f3f6f9", display: "flex", alignItems: "center", justifyContent: "center", p: 2 }}>
      <Paper sx={{ width: "100%", maxWidth: 480, p: { xs: 2.5, sm: 4 }, borderRadius: 3 }} elevation={2}>
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <img src={BEA_LOGO} alt="BE Analytic" style={{ height: 52 }} />
        </Box>
        {!info && !error && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        )}
        {error && <Alert severity="error">{error}</Alert>}
        {info && (
          <>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mb: 1 }}>
              {info.status === "valid" && <VerifiedIcon color="success" />}
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Test report
              </Typography>
            </Stack>
            {info.status === "valid" && (
              <Alert severity="success" sx={{ mb: 2 }}>
                This is a genuine report issued by {info.lab}, and it is the current issue.
              </Alert>
            )}
            {info.status === "superseded" && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                This report was replaced by a newer issue
                {info.latest ? ` (issued ${date(info.latest.issueDate)})` : ""}.{" "}
                {info.latest && (
                  <Link component={RouterLink} to={info.latest.url}>
                    Open the current report
                  </Link>
                )}
              </Alert>
            )}
            {info.status === "withdrawn" && (
              <Alert severity="error" sx={{ mb: 2 }}>
                This report was withdrawn by the laboratory and is no longer valid. Please contact {info.lab}.
              </Alert>
            )}
            <Box component="dl" sx={{ display: "grid", gridTemplateColumns: "auto 1fr", columnGap: 2, rowGap: 1, m: 0 }}>
              <Typography component="dt" color="text.secondary">
                Report no.
              </Typography>
              <Typography component="dd" sx={{ m: 0, fontWeight: 600 }}>
                {info.reportNumber}
              </Typography>
              {info.ulrNumber && (
                <>
                  <Typography component="dt" color="text.secondary">
                    ULR
                  </Typography>
                  <Typography component="dd" sx={{ m: 0 }}>
                    {info.ulrNumber}
                  </Typography>
                </>
              )}
              <Typography component="dt" color="text.secondary">
                Issue date
              </Typography>
              <Typography component="dd" sx={{ m: 0 }}>
                {date(info.issueDate)}
                {info.version > 1 ? ` (revision ${info.version - 1})` : ""}
              </Typography>
            </Box>
            {info.canDownload && (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 3 }}>
                <Button fullWidth variant="contained" startIcon={<PictureAsPdfIcon />} href={pdf(true)}>
                  Download PDF
                </Button>
                <Button fullWidth variant="outlined" href={pdf(false)} target="_blank" rel="noreferrer">
                  View
                </Button>
              </Stack>
            )}
          </>
        )}
        <Divider sx={{ my: 3 }} />
        <Typography variant="caption" color="text.secondary" component="div" sx={{ textAlign: "center" }}>
          BE Analytic Solutions LLP · B131/A, Devasandra Industrial Estate, Whitefield Rd, Mahadevapura, Bangalore 560048
          · sales@beanalytic.com
        </Typography>
      </Paper>
    </Box>
  );
}
