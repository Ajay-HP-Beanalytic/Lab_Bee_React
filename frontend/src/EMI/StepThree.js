import React, { useContext, useEffect } from "react";
import { EMIJCContext } from "./EMIJCContext";
import { useForm } from "react-hook-form";
import { Box, TextField } from "@mui/material";
import _ from "lodash";

export default function EMIJC_StepThree() {
  //Import the respective context:
  const { stepThreeFormData, updateStepThreeFormData } =
    useContext(EMIJCContext);

  const { register, setValue, watch } = useForm();

  // When the component mounts, populate the form fields with context data
  useEffect(() => {
    if (stepThreeFormData) {
      _.forEach(stepThreeFormData, (value, key) => {
        setValue(key, value || "");
      });
    }
  }, [stepThreeFormData, setValue]);

  // Watch form fields and update context on value change
  const stepThreeFormValues = watch();

  // Only update the context if the form data changes
  useEffect(() => {
    if (!_.isEqual(stepThreeFormValues, stepThreeFormData)) {
      updateStepThreeFormData(stepThreeFormValues);
    }
  }, [stepThreeFormValues, stepThreeFormData, updateStepThreeFormData]);

  return (
    <div>
      <h1>EMI JC Step Three</h1>
      <Box>
        <TextField
          label="Test Name"
          name="test"
          {...register("test")}
          fullWidth
        />
        <TextField
          label="Duration"
          name="duration"
          {...register("duration")}
          fullWidth
        />
      </Box>
    </div>
  );
}
