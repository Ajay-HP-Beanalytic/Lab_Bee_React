import { useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Divider,
  useTheme,
  useMediaQuery,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";

import useJobCardStore from "./stores/jobCardStore";
import RenderFormFields from "../components/RenderFormFields";
import RenderTable from "../functions/RenderTable";
import FileUploadComponent from "../components/FileUploadComponent";

import {
  EUT_TABLE_COLUMNS,
  TEST_TABLE_COLUMNS,
  ROW_TEMPLATES,
} from "./constants/tableConfigurations";
import {
  CUSTOMER_INFO_FIELDS,
  TEST_CONFIG_FIELDS,
} from "./constants/formFieldConfigurations";
import { TS1_JC_NOTES } from "./constants/jobCardConstants";

export default function TS1StepOne() {
  const jobcardStore = useJobCardStore();

  // Local state for deleted row IDs
  const [deletedEutIds, setDeletedEutIds] = useState([]);
  const [deletedTestIds, setDeletedTestIds] = useState([]);

  // Handle file changes
  const handleFilesChange = (newFiles) => {
    jobcardStore.setReferanceDocs(newFiles);
  };

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box sx={{ mt: 2 }}>
      {/* SERVICE REQUEST FORM Section */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: "2px", color: "#003366" }}>
            SERVICE REQUEST FORM
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            (To be filled by the customer)
          </Typography>

          <Grid
            container
            spacing={2}
            justifyContent="center"
            alignSelf="center"
            sx={{ padding: "10px" }}
          >
            {/* Customer Information Fields - 2 columns */}
            <Grid item xs={12} sm={6} md={6}>
              <RenderFormFields
                fields={CUSTOMER_INFO_FIELDS.slice(
                  0,
                  Math.ceil(CUSTOMER_INFO_FIELDS.length / 2)
                )}
                store={jobcardStore}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={6}>
              <RenderFormFields
                fields={CUSTOMER_INFO_FIELDS.slice(
                  Math.ceil(CUSTOMER_INFO_FIELDS.length / 2)
                )}
                store={jobcardStore}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider component="hr" sx={{ my: 1 }} />
            </Grid>

            {/* Test Configuration Fields - 2 columns */}
            <Grid item xs={12} sm={6} md={6}>
              <RenderFormFields
                fields={TEST_CONFIG_FIELDS.slice(
                  0,
                  Math.ceil(TEST_CONFIG_FIELDS.length / 2)
                )}
                store={jobcardStore}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={6}>
              <RenderFormFields
                fields={TEST_CONFIG_FIELDS.slice(
                  Math.ceil(TEST_CONFIG_FIELDS.length / 2)
                )}
                store={jobcardStore}
              />
            </Grid>

            {/* File Attachments */}
            <Grid item xs={12}>
              <Box
                sx={{
                  border: "1px dashed #ccc",
                  borderRadius: 2,
                  p: 2,
                  bgcolor: "#fafafa",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <FileUploadComponent
                  fieldName="Attach Reference Documents"
                  onFilesChange={handleFilesChange}
                  jcNumber={jobcardStore.jcNumberString}
                  existingAttachments={jobcardStore.referanceDocs}
                />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box
                sx={{
                  mt: 1,
                  mb: 1,
                  padding: 2,
                  border: "1px solid black",
                  backgroundColor: "#fff9e6",
                }}
              >
                <Typography variant="h5" sx={{ color: "#d32f2f", mb: 1 }}>
                  ⚠️ Important Notes - Customer Acknowledgment
                </Typography>
                {TS1_JC_NOTES.map((note) => (
                  <Grid key={note.value}>
                    <FormGroup>
                      <FormControlLabel
                        required
                        control={
                          <Checkbox
                            checked={
                              note.value === "jcNote1"
                                ? jobcardStore.jcNote1Checked
                                : jobcardStore.jcNote2Checked
                            }
                            onChange={(e) => {
                              if (note.value === "jcNote1") {
                                jobcardStore.setJcNote1Checked(
                                  e.target.checked
                                );
                              } else {
                                jobcardStore.setJcNote2Checked(
                                  e.target.checked
                                );
                              }
                            }}
                            sx={{
                              "color": "#d32f2f",
                              "&.Mui-checked": {
                                color: "#2e7d32",
                              },
                            }}
                          />
                        }
                        label={
                          <Typography
                            variant={isSmallScreen ? "body2" : "body1"}
                            sx={{ color: "#424242", fontWeight: 500 }}
                          >
                            {note.label}
                          </Typography>
                        }
                        sx={{ alignItems: "flex-start" }}
                      />
                    </FormGroup>
                  </Grid>
                ))}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* EUT/DUT DETAILS Section */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, color: "#003366" }}>
            EUT/DUT DETAILS
          </Typography>
          <RenderTable
            tableColumns={EUT_TABLE_COLUMNS}
            tableRows={jobcardStore.eutRows}
            setTableRows={jobcardStore.setEutRows}
            rowTemplate={ROW_TEMPLATES.eut}
            deletedIds={deletedEutIds}
            setDeletedIds={setDeletedEutIds}
          />
        </CardContent>
      </Card>

      {/* TEST DETAILS Section */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, color: "#003366" }}>
            TEST DETAILS
          </Typography>
          <RenderTable
            tableColumns={TEST_TABLE_COLUMNS}
            tableRows={jobcardStore.testRows}
            setTableRows={jobcardStore.setTestRows}
            rowTemplate={ROW_TEMPLATES.test}
            deletedIds={deletedTestIds}
            setDeletedIds={setDeletedTestIds}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
