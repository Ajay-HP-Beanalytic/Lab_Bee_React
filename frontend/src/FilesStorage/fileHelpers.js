export const formatFileSize = (bytes) => {
  if (bytes === null || bytes === undefined) return "";
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const getFileIcon = (file) => {
  if (file.type === "folder") return "📁";

  const ext = file.name.split(".").pop()?.toLowerCase();
  const iconMap = {
    pdf: "📄",
    doc: "📝",
    docx: "📝",
    xls: "📊",
    xlsx: "📊",
    ppt: "📽️",
    pptx: "📽️",
    txt: "📄",
    csv: "📊",
    jpg: "🖼️",
    jpeg: "🖼️",
    png: "🖼️",
    gif: "🖼️",
    webp: "🖼️",
    mp4: "🎥",
    mp3: "🎵",
    zip: "🗜️",
    json: "🔧",
  };

  return iconMap[ext] || "📄";
};
