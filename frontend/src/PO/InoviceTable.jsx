import { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import { serverBaseAddress } from "../Pages/APIPage";

const InvoiceTable = () => {
  const [invoiceData, setInvoiceData] = useState([]);

  //Implement lazy loading here

  const fetchInvoiceData = async () => {
    try {
      const response = await axios.get(
        `${serverBaseAddress}/api/getAllInvoiceData`
      );
      if (response.status === 200) {
        console.log("response.data ", response.data);
        setInvoiceData(response.data);
      } else {
        console.error(
          "Error fetching invoice data and setting state:",
          response.status
        );
      }
    } catch (error) {
      console.error("Error fetching invoice data:", error);
    }
  };

  const invoiceTableColumns = [
    {
      field: "id",
      headerName: "SL No",
      width: 80,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      editable: false,
    },
    {
      field: "company_name",
      headerName: "Company Name",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      editable: true,
    },
    {
      field: "invoice_number",
      headerName: "Invoice Number",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      editable: true,
    },
    {
      field: "invoice_date",
      headerName: "Invoice Date",
      width: 150,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      editable: true,
    },
    {
      field: "po_details",
      headerName: "PO Details",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      editable: true,
    },
    {
      field: "jc_details",
      headerName: "JC Details",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      editable: true,
    },
    {
      field: "invoice_amount",
      headerName: "Invoice Amount",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      editable: true,
    },
    {
      field: "invoice_status",
      headerName: "Invoice Status",
      width: 200,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      editable: true,
    },
    {
      field: "department",
      headerName: "Department",
      width: 100,
      align: "center",
      headerAlign: "center",
      headerClassName: "custom-header-color",
      editable: true,
    },
  ];

  useEffect(() => {
    fetchInvoiceData();
  }, []);
  return (
    <>
      <DataGrid rows={invoiceData} columns={invoiceTableColumns} />
    </>
  );
};

export default InvoiceTable;
