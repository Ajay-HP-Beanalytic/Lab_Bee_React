import axios from "axios";
import { serverBaseAddress } from "../../Pages/APIPage";

/**
 * Generic row management utilities for handling table rows
 */
export const rowManagement = {
  addRow: (rows, setRows) => {
    const lastId = rows.length > 0 ? rows[rows.length - 1].id : -1;
    const newRow = { id: lastId + 1, temporary: true };
    setRows([...rows, newRow]);
  },

  removeRow: async (id, rows, setRows, apiEndpoint, isTemporary) => {
    if (!window.confirm("Are you sure you want to delete this row?")) {
      return false;
    }

    if (isTemporary) {
      setRows(rows.filter((row) => row.id !== id));
      return true;
    }

    try {
      await axios.delete(`${serverBaseAddress}/api/${apiEndpoint}/${id}`);
      setRows(rows.filter((row) => row.id !== id));
      return true;
    } catch (error) {
      console.error(`Failed to delete row:`, error);
      alert("Failed to delete row. Please try again.");
      return false;
    }
  },

  updateRow: (index, field, value, rows, setRows) => {
    setRows((prevRows) =>
      prevRows.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      )
    );
  },

  updateRowsWithNewIds: (rows, newIds) => {
    return rows.map((row, index) => ({
      ...row,
      id: newIds[index] !== undefined ? newIds[index] : row.id,
      temporary: false,
    }));
  },
};

export default rowManagement;
