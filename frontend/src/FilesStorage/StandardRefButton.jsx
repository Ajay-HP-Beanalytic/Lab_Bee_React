import { useEffect, useState } from "react";
import { Chip, IconButton, Tooltip } from "@mui/material";
import { MenuBook } from "@mui/icons-material";
import { matchStandard } from "./standardLookup";
import StandardPanel from "./StandardPanel";

const COLOR = { exact: "primary", other_edition: "warning", related: "warning" };

/**
 * A button beside a test's standard that opens the standard at the method's
 * page (StandardPanel). Shows whether the standard is in the library.
 * reference: the standard as written ("MIL-STD-810H Method 507.6 Proc II")
 * method: the method when it is kept apart (EMI "CS114")
 * variant: "icon" (inside tables) or "chip" (with the standard's name)
 */
export default function StandardRefButton({ reference, method = "", variant = "icon" }) {
  const ref = String(reference || "").trim();
  const extra = String(method || "").trim();
  const [info, setInfo] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setInfo(null);
    if (!ref) return undefined;
    let live = true;
    // wait for typing to stop
    const timer = setTimeout(() => matchStandard(ref, extra).then((r) => live && setInfo(r)), 400);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [ref, extra]);

  if (!ref) return null;
  const found = info && info.match !== "none";
  const what = info ? `${info.designation || ref}${info.method ? ` · ${info.method}` : ""}${info.procedure ? ` · ${info.procedure}` : ""}` : ref;
  const tip = !info
    ? "Read the standard"
    : found
      ? `Read ${what}${info.note ? ` - ${info.note}` : ""}`
      : `${info.designation || ref} is not in the standards library`;

  const openPanel = (e) => {
    e.stopPropagation();
    setOpen(true);
  };

  return (
    <>
      <Tooltip title={tip}>
        {variant === "chip" ? (
          <Chip
            size="small"
            variant="outlined"
            icon={<MenuBook />}
            color={found ? COLOR[info.match] || "primary" : "default"}
            label={info && !found ? "Standard not in library" : what}
            onClick={openPanel}
            sx={{ maxWidth: 360, ...(info && !found ? { color: "text.secondary" } : {}) }}
          />
        ) : (
          <IconButton
            size="small"
            onClick={openPanel}
            color={found ? COLOR[info.match] || "primary" : "default"}
            sx={info && !found ? { color: "text.disabled" } : undefined}
            aria-label="Read the standard"
          >
            <MenuBook fontSize="small" />
          </IconButton>
        )}
      </Tooltip>
      {open && (
        // clicks in the panel would otherwise reach the row / card behind it through React
        <span onClick={(e) => e.stopPropagation()}>
          <StandardPanel reference={ref} method={extra} onClose={() => setOpen(false)} />
        </span>
      )}
    </>
  );
}
