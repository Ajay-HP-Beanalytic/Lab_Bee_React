// The on-screen preview can't draw Word's text watermark, so it shows DRAFT over each page in the
// same place. Spread into the sx of the box that holds the rendered document.
export const draftOverlaySx = {
  "& section.docx-preview": { position: "relative" },
  "& section.docx-preview::after": {
    content: '"DRAFT"',
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%) rotate(-45deg)",
    fontFamily: "Calibri, Arial, sans-serif",
    fontWeight: 700,
    fontSize: "170px",
    letterSpacing: "6px",
    color: "rgba(127, 127, 127, 0.25)",
    pointerEvents: "none",
  },
};
