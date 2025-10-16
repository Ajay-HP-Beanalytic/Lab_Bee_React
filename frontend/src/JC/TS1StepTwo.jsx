import { useState, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  Typography,
} from "@mui/material";

import useJobCardStore from "./stores/jobCardStore";
import RenderTable from "../functions/RenderTable";

import {
  TEST_PERFORMED_TABLE_COLUMNS,
  ROW_TEMPLATES,
} from "./constants/tableConfigurations";
import { JC_METADATA_FIELDS } from "./constants/formFieldConfigurations";
import RenderFormFields from "../components/RenderFormFields";

export default function TS1StepTwo() {
  const jobcardStore = useJobCardStore();

  // Local state for deleted row IDs
  const [deletedTestDetailsIds, setDeletedTestDetailsIds] = useState([]);

  // Get dynamic options from store
  const testCategoriesOptions = jobcardStore.getTestCategoriesAsOptions();
  const usersOptions = jobcardStore.getUsersAsOptions();

  // Update columns with dynamic options based on row data
  const getColumnOptions = (column, row) => {
    const selectedCategory = row?.testCategory;

    if (column.id === "testCategory") {
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
          <Typography variant="h6" sx={{ mb: 1, color: "#003366" }}>
            TESTS PERFORMED
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            Enter details of tests performed including chamber, dates,
            temperature, humidity, etc.
          </Typography>

          <Grid item xs={12} md={6} lg={6}>
            <RenderFormFields
              fields={JC_METADATA_FIELDS}
              store={jobcardStore}
            />
          </Grid>

          <Divider component="hr" sx={{ my: 1 }} />

          <RenderTable
            tableColumns={tableColumns}
            tableRows={jobcardStore.testDetailsRows}
            setTableRows={jobcardStore.setTestDetailsRows}
            rowTemplate={ROW_TEMPLATES.testPerformed}
            deletedIds={deletedTestDetailsIds}
            setDeletedIds={setDeletedTestDetailsIds}
            getColumnOptions={getColumnOptions}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
