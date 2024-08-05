import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Typography,
  Container,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Grid,
  InputLabel,
  MenuItem,
  FormControl,
  Select,
  Autocomplete,
  Divider,
  Card,
} from "@mui/material";
import axios from "axios";
import moment from "moment"; // To convert the date into desired format
import { sum, toWords } from "number-to-words"; // To convert number to words
import numberToWords from "number-to-words";
import { ToWords } from "to-words";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { styled } from "@mui/material/styles";

import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { useNavigate, useParams } from "react-router-dom";

import { serverBaseAddress } from "../Pages/APIPage";
import DocToPdf from "./DocToPdf";
import { UserContext } from "../Pages/UserContext";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

export default function Quotation() {
  const navigate = useNavigate();

  let initialCompanyName = "";
  let initialToCompanyAddress = "";
  let initialCustomerID = "";
  let initialCustomerReferance = "";
  let initialKindAttention = "";
  let initialProjectName = "";

  let defTestDescription = "";
  let defSacNo = "";
  let defDuration = "";
  let defUnit = "";
  let defPerUnitCharge = "";
  let defAmount = "";

  const initialTableData = [
    {
      id: 1,
      slno: 1,
      testDescription: defTestDescription,
      sacNo: defSacNo,
      duration: defDuration,
      unit: defUnit,
      perUnitCharge: defPerUnitCharge,
      amount: defAmount,
      module_id: 0,
    },
  ];

  const [modules, setModules] = useState([]);
  const [tableData, setTableData] = useState(initialTableData);

  const [counter, setCounter] = useState(tableData.length + 1);

  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [toCompanyAddress, setToCompanyAddress] = useState(
    initialToCompanyAddress
  );
  const [kindAttention, setKindAttention] = useState(initialKindAttention);
  const [customerId, setCustomerId] = useState(initialCustomerID);
  const [customerReferance, setCustomerreferance] = useState(
    initialCustomerReferance
  );
  const [projectName, setProjectName] = useState(initialProjectName);
  const [quoteCategory, setQuoteCategory] = useState("Environmental Testing");
  const [quoteVersion, setQuoteVersion] = useState("");
  const [quotationIdString, setQuotationIDString] = useState("");
  const [editId, setEditId] = useState("");
  const formattedDate = moment(new Date()).format("YYYY-MM-DD");
  const [selectedDate, setSelectedDate] = useState(formattedDate);
  const [catCode, setCatCode] = useState("TS1");
  const [updatingQuote, setUpdatingQuote] = useState(false);
  const [existingQuoteId, setExistingQuoteId] = useState("");

  // State variable to set the user name:

  const [isTotalDiscountVisible, setIsTotalDiscountVisible] = useState(false);

  const [originalTaxableAmount, setOriginalTaxableAmount] = useState(0);
  const [taxableAmount, setTaxableAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState("");
  const [totalAmountWords, setTotalAmountWords] = useState("");
  const [totalAmountAfterDiscount, setTotalAmountAfterDiscount] = useState(0);

  const { id } = useParams("id");

  const [companyIdList, setCompanyIdList] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");

  const { loggedInUser, loggedInUserDepartment } = useContext(UserContext);
  const [quotationCreatedBy, setQuotationCreatedBy] = useState("");

  //Use effect to set the quote created by:
  useEffect(() => {
    if (loggedInUser) {
      setQuotationCreatedBy(loggedInUser);
    }
  }, [loggedInUser]);

  // UseEffect to set the quotation data during update of the quotation:
  useEffect(() => {
    if (id) {
      setUpdatingQuote(true);
      axios.get(`${serverBaseAddress}/api/quotation/` + id).then((result) => {
        setCompanyName(result.data[0].company_name);
        setQuotationIDString(result.data[0].quotation_ids);
        setToCompanyAddress(result.data[0].company_address);
        setCustomerId(result.data[0].customer_id);
        setCustomerreferance(result.data[0].customer_referance);
        setSelectedDate(
          moment(result.data[0].quote_given_date).format("YYYY-MM-DD")
        );
        setKindAttention(result.data[0].kind_attention);
        setProjectName(result.data[0].project_name);
        setTotalAmountWords(result.data[0].total_taxable_amount_in_words);
        setEditId(result.data[0].id);
        setQuoteCategory(result.data[0].quote_category);
        setQuoteVersion(result.data[0].quote_version);
        setTableData(JSON.parse(result.data[0].tests));

        setExistingQuoteId(result.data[0].quotation_ids);
      });
    }

    //Fetch companyIds from the table in order to autofill the data:
    axios.get(`${serverBaseAddress}/api/getCompanyIdList`).then((result) => {
      const companyIds = result.data.map((item) => item.company_id);
      setCompanyIdList(companyIds);
    });

    //Fetch item soft modules list from the table :
    axios.get(`${serverBaseAddress}/api/getItemsoftModules/`).then((result) => {
      setModules(result.data);
    });

    // Set initial quotation ID when the component mounts
    setInitialQuotationId(initialCompanyName);
  }, [id]);

  // To prefill the primary company details on selecting company name:
  const prefillTextFields = (selectedCompanyId) => {
    if (selectedCompanyId) {
      axios
        .get(`${serverBaseAddress}/api/getCompanyDetails/` + selectedCompanyId)
        .then((result) => {
          setCompanyName(result.data[0].company_name);
          setToCompanyAddress(result.data[0].company_address);
          setKindAttention(result.data[0].contact_person);
          setCustomerId(result.data[0].company_id);
          setCustomerreferance(result.data[0].customer_referance);
          setSelectedDate(formattedDate);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  };

  // Function to add the new row on clicking plus btn:
  const addRow = () => {
    const newRow = {
      id:
        tableData.length > 0
          ? Math.max(...tableData.map((row) => row.id || 0)) + 1
          : 1,
      slno: tableData.length + 1,
      testDescription: defTestDescription,
      sacNo: defSacNo,
      duration: defDuration,
      unit: defUnit,
      perUnitCharge: defPerUnitCharge,
      amount: defAmount,
    };
    setTableData([...tableData, newRow]);
  };

  // Function to remove the new row on clicking minus btn:
  const removeRow = (id) => {
    const updatedData = tableData
      .filter((row) => row.id !== id)
      .map((row, index) => ({
        ...row,
        slno: index + 1, // Reassign slno based on new index
      }));
    setTableData(updatedData);
  };

  const handleInputChange = (slno, field, value) => {
    const updatedData = tableData.map((row) =>
      row.slno === slno ? { ...row, [field]: value } : row
    );
    setTableData(updatedData);
  };

  // To handle company names field:
  const handleCompanyNameChange = (e) => {
    if (id) {
      const arrayOfQuoteId = existingQuoteId.split("/");

      let updatedArrayOfQuoteId = [];

      updatedArrayOfQuoteId.push(arrayOfQuoteId[0]);
      updatedArrayOfQuoteId.push(arrayOfQuoteId[1]);
      updatedArrayOfQuoteId.push(e.target.value.toUpperCase());
      updatedArrayOfQuoteId.push(arrayOfQuoteId.at(-1));

      let result = updatedArrayOfQuoteId.join("/");

      setExistingQuoteId(result);
    }
    const newCompanyName = e.target.value.toUpperCase();
    setCustomerId(newCompanyName);
  };

  // To get the selected date and Time
  const handleQuoteGivenDateChange = (newDate) => {
    try {
      const formattedQuoteGivenDate = newDate
        ? dayjs(newDate).format("YYYY-MM-DD")
        : null;
      setSelectedDate(formattedQuoteGivenDate);
    } catch (error) {
      console.error("Error formatting JC close date:", error);
    }
  };

  // Set initial quotation ID based on the company name
  const setInitialQuotationId = (newCompanyName) => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear().toString().slice(-2);
    const currentMonth = (currentDate.getMonth() + 1)
      .toString()
      .padStart(2, "0");
    const currentDay = currentDate.getDate().toString();
    const dynamicQuotationIdString = `BEA/TS1/${newCompanyName}/${currentYear}${currentMonth}${currentDay}-001`;
    // setQuotationIDString(dynamicQuotationIdString);
  };

  // To generate quotation ID dynamically based on the last saved quoataion ID:
  const generateDynamicQuotationIdString = async () =>
    // newCompanyName,
    // catCodefromTarget = ""

    {
      if (id) {
        setQuotationIDString(existingQuoteId);
      } else {
        const currentDate = new Date();

        const newQuoteDate = currentDate
          .toISOString()
          .split("T")[0]
          .replace(/-/g, "")
          .slice(2);
        let lastQuotationID = "";

        try {
          const response = await axios.get(
            `${serverBaseAddress}/api/getLatestQuotationID`
          );

          if (response.status === 200) {
            lastQuotationID = response.data[0]?.quotation_ids;
          }
        } catch (error) {
          return;
        }
        let previousQuoteNumber = "";
        let newQuoteNumber = "";
        let newQuoteNumberStr = "";
        if (lastQuotationID) {
          const lastYearStr = lastQuotationID.slice(-10, -8);
          const lastMonthStr = lastQuotationID.slice(-8, -6);

          const currentYear = currentDate.getFullYear();
          const currentYearStr = currentYear.toString().slice(-2);
          const currentMonth = currentDate.getMonth() + 1;
          const currentMonthStr = currentMonth.toString().padStart(2, "0");

          if (
            lastYearStr === currentYearStr &&
            lastMonthStr === currentMonthStr
          ) {
            previousQuoteNumber = parseInt(lastQuotationID.slice(-3));
            newQuoteNumber = parseInt(previousQuoteNumber) + 1;
            newQuoteNumberStr = newQuoteNumber.toString().padStart(3, "0");
          } else {
            newQuoteNumberStr = "001";
          }
        }

        const newQuoteId = `BEA/${catCode}/${customerId}/${newQuoteDate}-${newQuoteNumberStr}`;

        // Set the quotation ID after fetching the last ID
        setQuotationIDString(newQuoteId);
      }
    };

  useEffect(() => {
    generateDynamicQuotationIdString();
  }, [quoteCategory, customerId]);

  // To submit the data and store it in a database:
  const handleSubmitETQuotation = async (e) => {
    e.preventDefault();

    if (
      !quotationIdString ||
      !customerId ||
      !toCompanyAddress ||
      !selectedDate ||
      !customerId ||
      !customerReferance ||
      !kindAttention ||
      !projectName ||
      !quoteCategory ||
      !quotationCreatedBy ||
      !tableData
    ) {
      toast.error("Please enter all the fields..!");
      return;
    }
    let isAtLeastOneRowIsFilled = false;
    // Check at least one row is filled completely or rlse give a error messgae:
    if (quoteCategory === "Item Soft") {
      isAtLeastOneRowIsFilled = tableData.some(
        (row) => row.module_id && row.amount
      );
    }
    if (quoteCategory === "Reliability") {
      isAtLeastOneRowIsFilled = tableData.some(
        (row) => row.testDescription && row.amount
      );
    }
    if (
      quoteCategory === "Environmental Testing" ||
      quoteCategory === "EMI & EMC"
    ) {
      isAtLeastOneRowIsFilled = tableData.some(
        (row) =>
          row.testDescription &&
          row.sacNo &&
          row.duration &&
          row.unit &&
          row.perUnitCharge &&
          row.amount
      );
    }

    if (!isAtLeastOneRowIsFilled) {
      toast.error("Please enter atleast one row of the table.");
      return;
    }

    axios
      .post(`${serverBaseAddress}/api/quotation/` + editId, {
        quotationIdString,
        companyName,
        toCompanyAddress,
        selectedDate,
        customerId,
        customerReferance,
        kindAttention,
        projectName,
        quoteCategory,
        quoteVersion,
        taxableAmount,
        totalAmountWords,
        quotationCreatedBy,
        tableData,
        loggedInUser,
      })
      .then((res) => {
        if (res.status === 200)
          toast.success(editId ? "Changes Saved" : "Quotation Added");
        if (res.status === 500) toast.error("Failed to create the quotation");
      });

    if (!editId) {
      handleCancelBtnIsClicked();
    }

    navigate("/quotation_dashboard");
  };

  // To update the amount cells based on the hours and unit per charge cells:
  const handleCellChange = (rowIndex, columnName, value) => {
    // Clone the existing data to avoid mutating state directly
    const updatedData = [...tableData];
    const row = updatedData[rowIndex - 1];

    // Check if the row exists in the array before trying to update it
    if (row) {
      if (columnName === "duration" || columnName === "perUnitCharge") {
        // Ensure that the value is numeric and not NaN
        const numericValue = parseFloat(value);
        if (!isNaN(numericValue)) {
          row[columnName] = numericValue;

          // Calculate the amount based on the duration and unit per charge
          const duration = parseFloat(row.duration);
          const perUnitCharge = parseFloat(row.perUnitCharge);
          if (!isNaN(duration) && !isNaN(perUnitCharge)) {
            row.amount = duration * perUnitCharge;
          }
        }
      } else {
        row[columnName] = value;
      }

      // Update the state with the new data
      setTableData(updatedData);
    }
  };

  // Clear input fields when the "Cancel" button is clicked
  const handleCancelBtnIsClicked = () => {
    setCompanyName(initialCompanyName);
    setToCompanyAddress(initialToCompanyAddress);
    setCustomerId(initialCustomerID);
    setCustomerreferance(initialCustomerReferance);
    setKindAttention(initialKindAttention);
    setProjectName(initialProjectName);
    setTableData(initialTableData);

    //setQuotationIDString(quotationIdString);
    setIsTotalDiscountVisible(false);
    setTaxableAmount(0);
    setDiscountAmount(0);
    setTotalAmountAfterDiscount(0);
    setTotalAmountWords("");
    setSelectedCompanyId("");
    setQuoteVersion("");
  };

  // Useeffect to calculate the total amount, to display that in word.
  useEffect(() => {
    const subtotal = tableData
      .map(({ amount }) => parseFloat(amount || 0))
      .reduce((sum, value) => sum + value, 0);

    // Apply the discount if it is visible
    const subTotalAfterDiscount = isTotalDiscountVisible
      ? subtotal - parseFloat(discountAmount || 0)
      : subtotal;

    // Save the original taxableAmount when it's not set yet
    if (originalTaxableAmount === 0) {
      setOriginalTaxableAmount(subTotalAfterDiscount);
    }

    setTaxableAmount(subtotal);
    setTotalAmountWords(
      // numberToWords.toWords(subTotalAfterDiscount).toUpperCase()
      toWords.convert(subTotalAfterDiscount).toUpperCase()
    );
    setTotalAmountAfterDiscount(subTotalAfterDiscount);
  }, [tableData, originalTaxableAmount]);

  //Indian rupees to words configuration
  const toWords = new ToWords({
    localeCode: "en-IN",
    converterOptions: {
      currency: true,
      ignoreDecimal: false,
      ignoreZeroCurrency: false,
      doNotAddOnly: false,
      currencyOptions: {
        // can be used to override defaults for the selected locale
        name: "Rupee",
        plural: "Rupees",
        symbol: "₹",
        fractionalUnit: {
          name: "Paisa",
          plural: "Paise",
          symbol: "",
        },
      },
    },
  });

  // Custom style for the table header
  const tableHeaderStyle = {
    backgroundColor: "#006699",
    fontWeight: "bold",
  };

  const tableCellStyle = { color: "white", minWidth: "150px", padding: "8px" };
  const tableSerialNumberCellStyle = {
    color: "white",
  };
  const tableContainerStyle = {
    overflowX: "auto", // Enable horizontal scrolling
  };

  const [showPdfDialog, setShowPdfDialog] = useState(false);

  // Function to handle download action
  const handleDownloadQuote = () => {
    setShowPdfDialog(true); // Show the PDF generation dialog
  };

  return (
    <div>
      <Grid
        item
        xs={12}
        md={6}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: { xs: "center", md: "center" },
          mb: 2,
        }}
      >
        <Box sx={{ width: "100%" }}>
          <Divider>
            <Typography variant="h4" sx={{ color: "#003366" }}>
              {" "}
              {editId ? "Update Quotation" : "Add New Quotation"}
            </Typography>
          </Divider>
        </Box>
      </Grid>

      <form onSubmit={handleSubmitETQuotation}>
        <Box sx={{ mb: 1 }}>
          <Grid container alignItems="center">
            <Grid
              item
              xs={12}
              md={6}
              sx={{ display: "flex", alignItems: "center" }}
            >
              <FormControl sx={{ width: { xs: "70%", md: "50%" } }}>
                <Autocomplete
                  disablePortal
                  value={selectedCompanyId}
                  onChange={(event, newValue) => {
                    setSelectedCompanyId(newValue);
                    prefillTextFields(newValue);
                  }}
                  options={companyIdList}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Company Data"
                      variant="outlined"
                    />
                  )}
                />
              </FormControl>
              <Tooltip title="Add New Company Data">
                <IconButton
                  size="large"
                  sx={{ ml: 1 }}
                  onClick={() => navigate("/quotation_essentials")}
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
            </Grid>
            <Grid
              item
              xs={12}
              md={6}
              sx={{ display: "flex", justifyContent: "flex-end" }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: "bold",
                  fontStyle: "italic",
                  color: "#003399",
                }}
              >
                Quotation ID: {quotationIdString}
                {/* Quotation ID: {editId ? existingQuoteId : quotationIdString} */}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Card
          sx={{
            paddingTop: "5",
            paddingBottom: "5",
            marginTop: "5",
            marginBottom: "5",
            elevation: 3,
          }}
        >
          <Grid container justifyContent="center" spacing={2}>
            <Grid item xs={12} md={6} elevation={4} sx={{ borderRadius: 3 }}>
              <Container
                component="span"
                margin={1}
                paddingright={1}
                elevation={11}
              >
                <Box>
                  <TextField
                    sx={{
                      marginTop: "16px",
                      marginBottom: "16px",
                      marginLeft: "10px",
                      borderRadius: 3,
                    }}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    label="Company Name"
                    fullWidth
                    variant="outlined"
                    autoComplete="on"
                  />
                  <div>
                    <TextField
                      sx={{
                        marginBottom: "16px",
                        marginLeft: "10px",
                        borderRadius: 3,
                      }}
                      label="To Address"
                      value={toCompanyAddress}
                      onChange={(e) => setToCompanyAddress(e.target.value)}
                      fullWidth
                      variant="outlined"
                      multiline={true}
                      rows={4}
                      autoComplete="on"
                    />
                  </div>
                  <div>
                    <TextField
                      sx={{
                        marginBottom: "16px",
                        marginLeft: "10px",
                        borderRadius: 3,
                      }}
                      value={kindAttention}
                      onChange={(e) => setKindAttention(e.target.value)}
                      label="Customer Name/Contact Person"
                      variant="outlined"
                      autoComplete="on"
                      fullWidth
                    />
                  </div>
                </Box>
              </Container>
            </Grid>

            <Grid item xs={12} md={6} elevation={4} sx={{ borderRadius: 3 }}>
              <Container
                component="span"
                margin={1}
                paddingright={1}
                elevation={11}
              >
                <Box>
                  <div>
                    <TextField
                      sx={{
                        marginTop: "16px",
                        marginBottom: "16px",
                        marginRight: "10px",
                        borderRadius: 3,
                      }}
                      label="Company ID"
                      value={customerId}
                      onChange={handleCompanyNameChange}
                      variant="outlined"
                      fullWidth
                    />
                  </div>

                  <div>
                    <FormControl
                      sx={{
                        width: "100%",
                        marginBottom: "10px",
                        marginRight: "10px",
                        borderRadius: 3,
                      }}
                    >
                      <InputLabel>Customer Referance</InputLabel>
                      <Select
                        defaultValue={customerReferance}
                        value={customerReferance}
                        onChange={(e) => setCustomerreferance(e.target.value)}
                        label="Customer Referance"
                        fullWidth
                      >
                        <MenuItem value="Email">Email</MenuItem>
                        <MenuItem value="Phone">Phone</MenuItem>
                      </Select>
                    </FormControl>
                  </div>

                  <div>
                    <TextField
                      sx={{
                        // marginBottom: "16px",
                        marginRight: "10px",
                        borderRadius: 3,
                      }}
                      label="Project Name"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      variant="outlined"
                      fullWidth
                    />
                  </div>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-end",
                      marginBottom: "16px",
                    }}
                  >
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        sx={{
                          width: "50%",
                          mb: "16px",
                          mr: "10px",
                          mt: "20px",
                          borderRadius: 3,
                        }}
                        label="Quote Given Date"
                        variant="outlined"
                        value={selectedDate ? dayjs(selectedDate) : null}
                        onChange={handleQuoteGivenDateChange}
                        renderInput={(props) => <TextField {...props} />}
                        format="YYYY-MM-DD"
                      />
                    </LocalizationProvider>

                    {!editId && (
                      <FormControl
                        sx={{
                          width: "50%",
                          marginBottom: "16px",
                          marginRight: "10px",
                          borderRadius: 3,
                        }}
                      >
                        <InputLabel>Quote Type</InputLabel>
                        <Select
                          value={quoteCategory}
                          onChange={(e) => {
                            setQuoteCategory(e.target.value);
                            if (e.target.value === "Environmental Testing") {
                              setCatCode("TS1");
                              // newCatCode = "TS1";
                            } else if (e.target.value === "EMI & EMC") {
                              setCatCode("TS2");
                              // newCatCode = "TS2";
                            } else if (e.target.value === "Reliability") {
                              setCatCode("RE");
                              // newCatCode = "RE";
                            } else if (e.target.value === "Item Soft") {
                              setCatCode("IT");
                              // newCatCode = "IT";
                            }
                          }}
                          label="Quote Type"
                        >
                          <MenuItem value="Environmental Testing">
                            Environmental Testing
                          </MenuItem>
                          <MenuItem value="Reliability">Reliability</MenuItem>
                          <MenuItem value="EMI & EMC">EMI & EMC</MenuItem>
                          <MenuItem value="Item Soft">Item Soft</MenuItem>
                        </Select>
                      </FormControl>
                    )}

                    <TextField
                      sx={{
                        width: "50%",
                        marginBottom: "16px",
                        marginRight: "10px",
                        borderRadius: 3,
                      }}
                      label="Quotation Version"
                      variant="outlined"
                      value={quoteVersion}
                      onChange={(e) => {
                        setQuoteVersion(e.target.value);
                      }}
                      fullWidth
                    />
                  </Box>
                </Box>
              </Container>
            </Grid>
          </Grid>
        </Card>

        <Box>
          <Grid
            container
            justifyContent="center"
            sx={{ marginTop: "10", paddingBottom: "3" }}
          >
            <Grid item xs={12} textAlign="center">
              <Typography sx={{ paddingBottom: 3, paddingTop: 5 }} variant="h5">
                Test Details
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TableContainer component={Paper} sx={tableContainerStyle}>
                <Table sx={{ minWidth: "100%" }} aria-label="simple table">
                  <TableHead sx={tableHeaderStyle}>
                    <TableRow>
                      <TableCell sx={tableSerialNumberCellStyle}>
                        {" "}
                        Sl No
                      </TableCell>
                      {(quoteCategory === "Environmental Testing" ||
                        quoteCategory === "EMI & EMC" ||
                        quoteCategory === "Reliability") && (
                        <TableCell align="center" sx={tableCellStyle}>
                          Test Description
                        </TableCell>
                      )}

                      {(quoteCategory === "Environmental Testing" ||
                        quoteCategory === "EMI & EMC") && (
                        <>
                          <TableCell align="center" sx={tableCellStyle}>
                            SAC No
                          </TableCell>
                          <TableCell align="center" sx={tableCellStyle}>
                            {" "}
                            Duration/Quantity
                          </TableCell>
                          <TableCell align="center" sx={tableCellStyle}>
                            Unit
                          </TableCell>
                          <TableCell align="center" sx={tableCellStyle}>
                            Per Unit Charge
                          </TableCell>
                        </>
                      )}

                      {quoteCategory === "Item Soft" && (
                        <TableCell align="center" sx={tableCellStyle}>
                          Module
                        </TableCell>
                      )}
                      <TableCell align="center" sx={tableCellStyle}>
                        Amount
                      </TableCell>

                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={addRow}
                          sx={{ color: "white" }}
                        >
                          <Tooltip title="Add Row" arrow>
                            <AddIcon />
                          </Tooltip>
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {tableData.map((row) => (
                      <StyledTableRow
                        key={row.id}
                        sx={{
                          "&:last-child td, &:last-child th": { border: 0 },
                        }}
                      >
                        <TableCell component="th" scope="row">
                          {row.slno}
                        </TableCell>
                        {(quoteCategory === "Environmental Testing" ||
                          quoteCategory === "EMI & EMC" ||
                          quoteCategory === "Reliability") && (
                          <TableCell align="center">
                            <TextField
                              value={row.testDescription}
                              onChange={(e) =>
                                handleInputChange(
                                  row.slno,
                                  "testDescription",
                                  e.target.value
                                )
                              }
                            />
                          </TableCell>
                        )}
                        {(quoteCategory === "Environmental Testing" ||
                          quoteCategory === "EMI & EMC") && (
                          <>
                            <TableCell align="center">
                              <TextField
                                value={row.sacNo}
                                onChange={(e) =>
                                  handleInputChange(
                                    row.slno,
                                    "sacNo",
                                    e.target.value
                                  )
                                }
                              />
                            </TableCell>

                            <TableCell align="center">
                              <TextField
                                value={row.duration}
                                type="number"
                                onChange={(e) =>
                                  handleCellChange(
                                    row.slno,
                                    "duration",
                                    parseFloat(e.target.value)
                                  )
                                }
                              />
                            </TableCell>

                            <TableCell align="center">
                              <FormControl sx={{ minWidth: "150px" }}>
                                <Select
                                  value={row.unit}
                                  onChange={(e) =>
                                    handleInputChange(
                                      row.slno,
                                      "unit",
                                      e.target.value
                                    )
                                  }
                                >
                                  <MenuItem value="Hour"> Hour </MenuItem>
                                  <MenuItem value="Test"> Test </MenuItem>
                                  <MenuItem value="Per Sample">
                                    {" "}
                                    Per Sample{" "}
                                  </MenuItem>
                                  <MenuItem value="Days"> Days </MenuItem>
                                </Select>
                              </FormControl>
                            </TableCell>

                            <TableCell align="center">
                              <TextField
                                value={row.perUnitCharge}
                                type="number"
                                onChange={(e) =>
                                  handleCellChange(
                                    row.slno,
                                    "perUnitCharge",
                                    parseFloat(e.target.value)
                                  )
                                }
                              />
                            </TableCell>
                          </>
                        )}
                        {quoteCategory === "Item Soft" && (
                          <>
                            <TableCell align="center">
                              <FormControl sx={{ minWidth: "150px" }}>
                                <Select
                                  value={row.module_id}
                                  onChange={(e) =>
                                    handleInputChange(
                                      row.slno,
                                      "module_id",
                                      e.target.value
                                    )
                                  }
                                >
                                  {modules.map((item) => (
                                    <MenuItem key={item.id} value={item.id}>
                                      {item.module_name} -{" "}
                                      {item.module_description}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </TableCell>
                          </>
                        )}

                        <TableCell align="center">
                          <TextField
                            value={row.amount}
                            type="number"
                            onChange={(e) =>
                              handleCellChange(
                                row.slno,
                                "amount",
                                parseFloat(e.target.value)
                              )
                            }
                          />
                        </TableCell>

                        <TableCell align="center">
                          <IconButton
                            color="secondary"
                            size="small"
                            onClick={() => removeRow(row.id)}
                          >
                            <Tooltip title="Remove row" arrow>
                              <RemoveIcon />
                            </Tooltip>
                          </IconButton>
                        </TableCell>
                      </StyledTableRow>
                    ))}
                  </TableBody>
                  <Box display="flex" justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      onClick={addRow}
                      sx={{
                        mt: 1,
                        ml: 1,
                        minWidth: "120px",
                        textAlign: "center",
                      }}
                    >
                      Add Row
                    </Button>
                  </Box>
                </Table>

                <hr
                  sx={{
                    border: "1px solid black",
                    marginTop: "20",
                    marginBottom: "10",
                  }}
                />

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <TableRow>
                    <TableCell rowSpan={3} />
                    <TableCell colSpan={3}>
                      <Typography variant="h6">
                        Taxable Amount (₹): {taxableAmount.toFixed(2)}
                      </Typography>
                    </TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell colSpan={3}>
                      <Typography variant="h6">
                        Total Taxable Amount in Rupees: {totalAmountWords}
                      </Typography>
                    </TableCell>
                  </TableRow>
                </Box>
              </TableContainer>
            </Grid>
          </Grid>

          <Box sx={{ marginTop: 3, marginBottom: 0.5, alignContent: "center" }}>
            <Button
              sx={{
                borderRadius: 3,
                mx: 0.5,
                mb: 1,
                bgcolor: "orange",
                color: "white",
                borderColor: "black",
              }}
              variant="contained"
              color="primary"
              onClick={() => navigate("/quotation_dashboard")}
            >
              Close
            </Button>

            <Button
              sx={{
                borderRadius: 3,
                mx: 0.5,
                mb: 1,
                bgcolor: "orange",
                color: "white",
                borderColor: "black",
              }}
              variant="contained"
              color="primary"
              type="submit"
            >
              {editId ? "Update" : "Submit"}
            </Button>

            {editId && (
              <Tooltip title="Download quotation" arrow>
                <Button
                  variant="contained"
                  startIcon={<FileDownloadIcon />}
                  sx={{
                    borderRadius: 3,
                    mx: 0.5,
                    mb: 1,
                    bgcolor: "orange",
                    color: "white",
                    borderColor: "black",
                  }}
                  onClick={handleDownloadQuote}
                >
                  Download
                </Button>
              </Tooltip>
            )}

            {/* Dialog for PDF generation */}
            {showPdfDialog && (
              <DocToPdf id={editId} onClose={() => setShowPdfDialog(false)} />
            )}
          </Box>
        </Box>
      </form>
    </div>
  );
}
