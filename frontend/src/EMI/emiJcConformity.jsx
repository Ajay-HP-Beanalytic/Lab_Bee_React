import { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Divider,
  TextField,
  IconButton,
  Tooltip,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import { Controller } from "react-hook-form";

const EMIJCConformity = ({ control, watch }) => {
  const conformityStatement = watch("conformityStatement");
  const decisionRuleApplicable = watch("decisionRuleApplicable");

  const showDecisionRule = conformityStatement === "Yes";
  const showDecisionRuleOptions =
    showDecisionRule && decisionRuleApplicable === "Applicable";

  const customerWitness = watch("customerWitness");
  const showCustomerWitness = customerWitness === "Yes";
  const witness1 = watch("customerWitness1");
  const witness2 = watch("customerWitness2");
  const witness3 = watch("customerWitness3");
  const witness4 = watch("customerWitness4");
  const witness5 = watch("customerWitness5");
  const witness6 = watch("customerWitness6");
  const [witnessCount, setWitnessCount] = useState(3);

  useEffect(() => {
    if (!showCustomerWitness) {
      setWitnessCount(3);
      return;
    }

    const values = [witness1, witness2, witness3, witness4, witness5, witness6];
    let requiredCount = 3;
    values.forEach((value, index) => {
      if (String(value || "").trim() !== "") {
        requiredCount = index + 1;
      }
    });

    setWitnessCount((prev) => Math.max(prev, Math.min(requiredCount, 6)));
  }, [
    showCustomerWitness,
    witness1,
    witness2,
    witness3,
    witness4,
    witness5,
    witness6,
  ]);
  const rowSx = {
    borderBottom: "1px solid",
    borderColor: "divider",
    px: 2,
    py: 1,
  };
  const labelSx = {
    fontWeight: 600,
    color: "text.primary",
  };
  const contentSx = {
    display: "flex",
    alignItems: "flex-start",
    minHeight: 40,
  };

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        overflow: "hidden",
        bgcolor: "background.paper",
      }}
    >
      <Box sx={{ px: 2, py: 1.5, bgcolor: "grey.50" }}>
        <Typography variant="h5">Statement of Conformity</Typography>
      </Box>
      <Divider />

      <Grid container alignItems="center" sx={rowSx}>
        <Grid item xs={12} md={4}>
          <Typography variant="body2" sx={labelSx}>
            Statement of Conformity
          </Typography>
        </Grid>
        <Grid item xs={12} md={8} sx={contentSx}>
          <Controller
            name="conformityStatement"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <RadioGroup row aria-label="Statement of Conformity" {...field}>
                <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
                <FormControlLabel value="No" control={<Radio />} label="No" />
              </RadioGroup>
            )}
          />
        </Grid>
      </Grid>

      {showDecisionRule && (
        <Grid container alignItems="center" sx={rowSx}>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" sx={labelSx}>
              If Yes Decision Rule
            </Typography>
          </Grid>
          <Grid item xs={12} md={8} sx={contentSx}>
            <Controller
              name="decisionRuleApplicable"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <RadioGroup row aria-label="If Yes Decision Rule" {...field}>
                  <FormControlLabel
                    value="Applicable"
                    control={<Radio />}
                    label="Applicable"
                  />
                  <FormControlLabel
                    value="Not Applicable"
                    control={<Radio />}
                    label="Not Applicable"
                  />
                </RadioGroup>
              )}
            />
          </Grid>
        </Grid>
      )}

      <Grid container alignItems="flex-start" sx={rowSx}>
        <Grid item xs={12} md={4}>
          <Typography variant="body2" sx={labelSx}>
            Note
          </Typography>
        </Grid>
        <Grid
          item
          xs={12}
          md={8}
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            textAlign: "left",
          }}
        >
          <Typography variant="body2" sx={{ mt: 0.5 }} color="red">
            1. If Applicable, simple acceptance rule without considering
            Measurement Uncertainty (MU):
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.25 }} color="red">
            a) Pass when measured value &lt; limit specified by the standard.
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.25 }} color="red">
            b) Fail when measured value &gt; limit specified by the standard.
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }} color="red">
            2. Acceptance rule considering Measurement Uncertainty (MU):
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.25 }} color="red">
            a) Pass when measured value + MU &lt; limit specified by the
            standard.
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.25 }} color="red">
            b) Fail when measured value - MU &gt; limit specified by the
            standard.
          </Typography>
          <Typography
            variant="body2"
            sx={{ mt: 0.75, fontWeight: 550 }}
            color="red"
          >
            3. If No, Statement of Conformity will not be provided.
          </Typography>
        </Grid>
      </Grid>

      <Grid container alignItems="center" sx={rowSx}>
        <Grid item xs={12} md={4}>
          <Typography variant="body2" sx={labelSx}>
            Test Report
          </Typography>
        </Grid>
        <Grid item xs={12} md={8}>
          <FormGroup row sx={{ flexWrap: "wrap", columnGap: 2 }}>
            <Controller
              name="testResultReportRequired"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  }
                  label="Report Required"
                />
              )}
            />
            <Controller
              name="testResultReportHardCopy"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  }
                  label="Hard Copy"
                />
              )}
            />

            <Controller
              name="certificateSoftCopy"
              control={control}
              defaultValue={false}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={!!field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  }
                  label="Soft Copy"
                />
              )}
            />
          </FormGroup>
        </Grid>
      </Grid>

      <Grid container alignItems="center" sx={{ px: 2, py: 1.25 }}>
        <Grid item xs={12} md={4}>
          <Typography variant="body2" sx={labelSx}>
            Customer Witness
          </Typography>
        </Grid>
        <Grid item xs={12} md={8} sx={contentSx}>
          <Controller
            name="customerWitness"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <RadioGroup
                row
                aria-label="Customer Witness"
                {...field}
                sx={{ flexWrap: "nowrap", columnGap: 2 }}
              >
                <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
                <FormControlLabel value="No" control={<Radio />} label="No" />
              </RadioGroup>
            )}
          />
        </Grid>
      </Grid>

      {showCustomerWitness && (
        <Grid container spacing={2} sx={{ px: 2, py: 1.25 }}>
          <Grid item xs={12} sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Tooltip title="Remove Customer Witness">
              <span>
                <IconButton
                  color="primary"
                  onClick={() => setWitnessCount((prev) => Math.max(prev - 1, 3))}
                  disabled={witnessCount <= 3}
                  size="small"
                >
                  <RemoveCircleOutlineIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Add Customer Witness">
              <span>
                <IconButton
                  color="primary"
                  onClick={() => setWitnessCount((prev) => Math.min(prev + 1, 6))}
                  disabled={witnessCount >= 6}
                  size="small"
                >
                  <AddCircleOutlineIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Grid>

          {Array.from({ length: witnessCount }, (_, index) => {
            const witnessIndex = index + 1;
            const fieldName = `customerWitness${witnessIndex}`;
            return (
              <Grid item xs={12} md={4} key={fieldName}>
                <Controller
                  name={fieldName}
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label={`Customer Witness ${witnessIndex}`}
                      fullWidth
                    />
                  )}
                />
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
};

export default EMIJCConformity;
