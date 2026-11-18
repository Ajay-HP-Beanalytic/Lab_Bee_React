import { useState, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  // Divider,
  Grid,
  Typography,
} from "@mui/material";

import useJobCardStore from "./stores/jobCardStore";
import RenderTable from "../functions/RenderTable";

import {
  TEST_PERFORMED_TABLE_COLUMNS,
  ROW_TEMPLATES,
} from "./constants/tableConfigurations";
import {
  // JC_METADATA_FIELDS,
  JC_OBSERVATIONS_FIELD,
} from "./constants/formFieldConfigurations";
import RenderFormFields from "../components/RenderFormFields";

export default function TS1StepTwo() {
  const jobcardStore = useJobCardStore();

  // Local state for deleted row IDs
  const [deletedTestDetailsIds, setDeletedTestDetailsIds] = useState([]);

  // Get dynamic options from store
  const testCategoriesOptions = jobcardStore.getTestCategoriesAsOptions();
  const usersOptions = jobcardStore.getUsersAsOptions();

  // From this job card's step 1: the EUT serial numbers (all of them together as the
  // first choice when there are several) and the test standards; typing stays allowed
  const uniq = (list) => [...new Set(list.map((v) => String(v || "").trim()).filter(Boolean))];
  const eutSerialOptions = useMemo(() => {
    const serials = uniq((jobcardStore.eutRows || []).filter((r) => !r.temporary).map((r) => r.serialNo));
    return serials.length > 1 ? [serials.join(", "), ...serials] : serials;
  }, [jobcardStore.eutRows]);
  const standardOptions = useMemo(
    () => uniq((jobcardStore.testRows || []).filter((r) => !r.temporary).map((r) => r.testStandard)),
    [jobcardStore.testRows],
  );

  // Update columns with dynamic options based on row data
  const getColumnOptions = (column, row) => {
    const selectedCategory = row?.testCategory;

    if (column.id === "eutSerialNo") {
      return eutSerialOptions;
    } else if (column.id === "standard") {
      return standardOptions;
    } else if (column.id === "testCategory") {
      return testCategoriesOptions;
    } else if (column.id === "testName") {
      // Filter test names based on selected category
      if (selectedCategory) {
        return jobcardStore.getTestNamesByCategory(selectedCategory);
      }
      return [];
    } else if (column.id === "testChamber") {
      // Filter chambers based on selected category
      if (selectedCategory) {
        return jobcardStore.getChambersByCategory(selectedCategory);
      }
      return [];
    } else if (
      column.id === "testStartedBy" ||
      column.id === "testEndedBy" ||
      column.id === "testReviewedBy" ||
      column.id === "preparedBy"
    ) {
      return usersOptions;
    }
    return column.options || [];
  };

  // Update columns with dynamic options
  const tableColumns = useMemo(() => {
    return TEST_PERFORMED_TABLE_COLUMNS.map((column) => {
      const updatedColumn = { ...column };

      // For category column, set options directly
      if (column.id === "testCategory") {
        updatedColumn.options = testCategoriesOptions;
      } else if (
        column.id === "testStartedBy" ||
        column.id === "testEndedBy" ||
        column.id === "testReviewedBy" ||
        column.id === "preparedBy"
      ) {
        updatedColumn.options = usersOptions;
      }
      // For testName and testChamber, we'll handle dynamically per row
      // So we leave options empty here

      return updatedColumn;
    });
  }, [testCategoriesOptions, usersOptions]);

  return (
    <Box sx={{ mt: 2 }}>
      {/* TEST PERFORMED DETAILS Section */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: "20px", color: "#003366" }}>
            TESTS PERFORMED
          </Typography>

          {/* <Grid item xs={12} md={6} lg={6}>
            <RenderFormFields
              fields={JC_METADATA_FIELDS}
              store={jobcardStore}
            />
          </Grid> */}

          {/* <Divider component="hr" sx={{ my: 1 }} /> */}

          <RenderTable
            tableColumns={tableColumns}
            tableRows={jobcardStore.testDetailsRows}
            setTableRows={jobcardStore.setTestDetailsRows}
            rowTemplate={ROW_TEMPLATES.testPerformed}
            deletedIds={deletedTestDetailsIds}
            setDeletedIds={setDeletedTestDetailsIds}
            getColumnOptions={getColumnOptions}
          />

          <Grid item xs={12} md={6} lg={6} sx={{ mt: "20px" }}>
            <RenderFormFields
              fields={JC_OBSERVATIONS_FIELD}
              store={jobcardStore}
            />
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
