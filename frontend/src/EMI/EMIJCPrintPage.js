import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { renderAsync } from "docx-preview";
import { saveAs } from "file-saver";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import { serverBaseAddress } from "../Pages/APIPage";
import { generateEmiDocxBlob } from "./EMIJCDocument";

const EMIJCPrintPage = () => {
  const { id } = useParams();

  const containerRef = useRef(null);
  const blobRef = useRef(null);
  const fileNameRef = useRef("EMI_JC");
  const injectedStyleRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [savingPdf, setSavingPdf] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setError("No job card ID found in URL.");
      setLoading(false);
      return;
    }

    generateEmiDocxBlob(id)
      .then(({ blob, jcNumber }) => {
        blobRef.current = blob;
        fileNameRef.current = `JC_${jcNumber}`;

        return renderAsync(blob, containerRef.current, null, {
          className: "docx",
          inWrapper: true,
          breakPages: true,
          useBase64URL: true,
          ignoreWidth: false,
          ignoreHeight: false,
        });
      })
      .then(() => {
        // Detect portrait / landscape pages and inject exact @page dimensions
        const pages = containerRef.current?.querySelectorAll(".docx") ?? [];
        let portraitSize = null;
        let landscapeSize = null;

        pages.forEach((page) => {
          // Hide artifact blank pages that docx-preview renders for title-page sections
          const txt = (page.textContent || "").trim();
          const imgs = page.querySelectorAll("img, svg").length;
          if (txt.length === 0 && imgs === 0) {
            page.style.display = "none";
            return;
          }

          const w = parseFloat(page.style.width);
          const h =
            parseFloat(page.style.minHeight) || parseFloat(page.style.height);
          if (w > 0 && h > 0) {
            if (w > h) {
              page.classList.add("docx-landscape");
              if (!landscapeSize) landscapeSize = { w, h };
            } else {
              if (!portraitSize) portraitSize = { w, h };
            }
          }
        });

        let css = portraitSize
          ? `@page { size: ${portraitSize.w}pt ${portraitSize.h}pt; margin: 0; }\n`
          : `@page { size: auto; margin: 0; }\n`;
        if (landscapeSize) {
          css += `@page docx-landscape { size: ${landscapeSize.w}pt ${landscapeSize.h}pt; margin: 0; }\n`;
        }

        const styleEl = document.createElement("style");
        styleEl.textContent = css;
        document.head.appendChild(styleEl);
        injectedStyleRef.current = styleEl;

        setLoading(false);
      })
      .catch((err) => {
        console.error("EMIJCPrintPage error:", err);
        setError(
          "Failed to load document. Please close this tab and try again.",
        );
        setLoading(false);
      });

    return () => {
      if (injectedStyleRef.current) {
        document.head.removeChild(injectedStyleRef.current);
        injectedStyleRef.current = null;
      }
    };
  }, [id]);

  const handleDownloadWord = () => {
    if (blobRef.current) {
      saveAs(blobRef.current, `${fileNameRef.current}.docx`);
    }
  };

  const handleSaveAsPdf = async () => {
    if (!blobRef.current || savingPdf) return;
    setSavingPdf(true);
    try {
      const formData = new FormData();
      formData.append("file", blobRef.current, `${fileNameRef.current}.docx`);

      const response = await fetch(`${serverBaseAddress}/api/convert-to-pdf`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Conversion failed");
      }

      const pdfBlob = await response.blob();
      saveAs(pdfBlob, `${fileNameRef.current}.pdf`);
    } catch (err) {
      console.error("PDF conversion error:", err);
      alert(`PDF conversion failed: ${err.message}`);
    } finally {
      setSavingPdf(false);
    }
  };

  return (
    <>
      <Box
        className="jc-print-root"
        sx={{ height: "100vh", display: "flex", flexDirection: "column" }}
      >
        {/* Toolbar */}
        <Box
          className="no-print"
          sx={{
            px: 2,
            py: 1,
            display: "flex",
            gap: 1.5,
            alignItems: "center",
            bgcolor: "#1565c0",
            flexShrink: 0,
          }}
        >
          {loading ? (
            <>
              <CircularProgress size={20} sx={{ color: "white" }} />
              <Typography sx={{ color: "white", ml: 1 }}>
                Loading document…
              </Typography>
            </>
          ) : (
            <>
              <Typography
                sx={{ color: "white", fontWeight: 600, mr: 1 }}
                variant="body2"
              >
                {fileNameRef.current}
              </Typography>

              <Divider
                orientation="vertical"
                flexItem
                sx={{ borderColor: "rgba(255,255,255,0.4)" }}
              />

              <Button
                variant="contained"
                color="inherit"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadWord}
                sx={{ bgcolor: "white", color: "#1565c0", fontWeight: 600 }}
              >
                Download
              </Button>

              <Button
                variant="outlined"
                startIcon={
                  savingPdf ? (
                    <CircularProgress size={16} sx={{ color: "white" }} />
                  ) : (
                    <PictureAsPdfIcon />
                  )
                }
                onClick={handleSaveAsPdf}
                disabled={savingPdf}
                sx={{ color: "white", borderColor: "white", fontWeight: 600 }}
              >
                {savingPdf ? "Converting…" : "Save as PDF"}
              </Button>

              <Box sx={{ flex: 1 }} />

              <Button
                variant="text"
                onClick={() => window.close()}
                sx={{ color: "rgba(255,255,255,0.7)" }}
              >
                Close
              </Button>
            </>
          )}
        </Box>

        {/* Document preview */}
        {error ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : (
          <Box
            ref={containerRef}
            className="jc-doc-container"
            sx={{ flex: 1, overflow: "auto", bgcolor: "#e0e0e0" }}
          />
        )}
      </Box>

      <style>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print { display: none !important; }
          html, body, #root { height: auto !important; overflow: visible !important; min-height: 0 !important; }
          .jc-print-root { height: auto !important; display: block !important; overflow: visible !important; }
          .jc-doc-container { height: auto !important; overflow: visible !important; background: white !important; flex: none !important; }
          .docx-wrapper { display: block !important; background: white !important; padding: 0 !important; margin: 0 !important; }
          .docx { box-shadow: none !important; margin: 0 !important; break-after: page; page-break-after: always; }
          .docx.docx-landscape { page: docx-landscape; }
          .docx:last-child { break-after: avoid; page-break-after: avoid; }
        }
      `}</style>
    </>
  );
};

export default EMIJCPrintPage;
