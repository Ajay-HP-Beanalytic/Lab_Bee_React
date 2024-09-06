import React, { useContext, useEffect } from "react";
import { EMIJCContext } from "./EMIJCContext";
import { useForm } from "react-hook-form";
import { Box, TextField } from "@mui/material";

export default function EMIJC_StepThree() {
  //Import the respective context:
  const { stepThreeFormData, updateStepThreeFormData } =
    useContext(EMIJCContext);

  const { register, setValue, watch } = useForm();

  // When the component mounts, populate the form fields with context data
  useEffect(() => {
    if (stepThreeFormData) {
      setValue("test", stepThreeFormData.test || "");
      setValue("duration", stepThreeFormData.duration || "");
    }
  }, [stepThreeFormData, setValue]);

  // Watch form fields and update context on value change
  const stepThreeFormValues = watch();

  useEffect(() => {
    updateStepThreeFormData(stepThreeFormValues);
  }, [stepThreeFormValues, updateStepThreeFormData]);

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
