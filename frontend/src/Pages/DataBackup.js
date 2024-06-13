import React from "react";
import { Button } from "@mui/material";
import { serverBaseAddress } from "./APIPage";
import axios from "axios";
import { toast } from "react-toastify";

const DataBackup = () => {
  const downloadBackupData = () => {
    axios
      .get(`${serverBaseAddress}/api/downloadDataBackup`, {
        responseType: "blob",
      })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `labbee_database_backup_${new Date()
          .toISOString()
          .slice(0, 10)}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Backup data downloaded successfully!");
      })
      .catch((error) => {
        console.error("Error downloading the backup:", error);
        toast.error("Error downloading the backup");
      });
  };

  return (
    <Button
      sx={{
        borderRadius: 1,
        bgcolor: "orange",
        color: "white",
        borderColor: "black",
      }}
      variant="contained"
      color="primary"
      onClick={downloadBackupData}
    >
      {" "}
      Download Backup Data{" "}
    </Button>
  );
};

export default DataBackup;
