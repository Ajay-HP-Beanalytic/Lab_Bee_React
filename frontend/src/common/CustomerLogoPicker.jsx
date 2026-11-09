import { useRef, useState } from "react";
import axios from "axios";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import DeleteIcon from "@mui/icons-material/Delete";
import { serverBaseAddress } from "../Pages/APIPage";

const TYPES = ["image/png", "image/jpeg", "image/gif"];
const MAX_BYTES = 2 * 1024 * 1024;

export const customerLogoUrl = (customerId, version) =>
  `${serverBaseAddress}/api/customer_logo/${customerId}${version ? `?v=${encodeURIComponent(version)}` : ""}`;

/**
 * A customer's logo (customer_logos): shows it, and saves a new one picked,
 * dropped or pasted (Ctrl+V of a copied image). Used on the quotation download.
 * @param customerId customers_details.id
 * @param hasLogo whether the customer has a logo now
 * @param onChange called after a save or removal
 */
export default function CustomerLogoPicker({ customerId, hasLogo, version, onChange, compact = false }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [over, setOver] = useState(false);

  const save = async (file) => {
    setError("");
    if (!file) return;
    if (!TYPES.includes(file.type)) return setError("Use a PNG, JPG or GIF image");
    if (file.size > MAX_BYTES) return setError("The logo must be smaller than 2 MB");
    const form = new FormData();
    form.append("logo", file, file.name || "logo.png");
    setBusy(true);
    try {
      await axios.put(`${serverBaseAddress}/api/customer_logo/${customerId}`, form);
      onChange?.();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save the logo");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await axios.delete(`${serverBaseAddress}/api/customer_logo/${customerId}`);
      onChange?.();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to remove the logo");
    } finally {
      setBusy(false);
    }
  };

  const onPaste = (e) => {
    const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith("image/"));
    if (item) {
      e.preventDefault();
      save(item.getAsFile());
    }
  };

  const size = compact ? 48 : 72;
  return (
    <Box>
      <Box
        tabIndex={0}
        onPaste={onPaste}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          save(e.dataTransfer.files[0]);
        }}
        onClick={() => inputRef.current?.click()}
        title="Click to choose, drop an image here, or click and press Ctrl+V to paste"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 1,
          border: "1px dashed",
          borderColor: over ? "primary.main" : "divider",
          borderRadius: 1,
          cursor: "pointer",
          bgcolor: over ? "action.hover" : "transparent",
          outline: "none",
          "&:focus": { borderColor: "primary.main" },
        }}
      >
        <Box
          sx={{
            width: size * 2,
            height: size,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "background.default",
            borderRadius: 0.5,
            flexShrink: 0,
          }}
        >
          {busy ? (
            <CircularProgress size={20} />
          ) : hasLogo ? (
            <img src={customerLogoUrl(customerId, version)} alt="Customer logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
          ) : (
            <ImageIcon color="disabled" />
          )}
        </Box>
        <Typography variant="caption" color="text.secondary">
          {hasLogo ? "Logo saved. Click, drop or paste to replace it." : "No logo yet. Click to choose, drop an image, or click here and paste (Ctrl+V)."}
        </Typography>
        <input
          ref={inputRef}
          type="file"
          accept={TYPES.join(",")}
          hidden
          onChange={(e) => {
            save(e.target.files[0]);
            e.target.value = "";
          }}
        />
      </Box>
      {hasLogo && !busy && (
        <Button size="small" color="inherit" startIcon={<DeleteIcon fontSize="small" />} onClick={remove} sx={{ mt: 0.5 }}>
          Remove logo
        </Button>
      )}
      {error && (
        <Typography variant="caption" color="error" display="block">
          {error}
        </Typography>
      )}
    </Box>
  );
}
