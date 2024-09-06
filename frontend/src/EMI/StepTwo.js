import React, { useContext, useEffect } from "react";
import { EMIJCContext } from "./EMIJCContext";
import { useForm } from "react-hook-form";
import { Box, TextField } from "@mui/material";

export default function EMIJC_StepTwo() {
  //Import the respective context:
  const { stepTwoFormData, updateStepTwoFormData } = useContext(EMIJCContext);

  const { register, setValue, watch } = useForm();

  // When the component mounts, populate the form fields with context data
  useEffect(() => {
    if (stepTwoFormData) {
      setValue("address", stepTwoFormData.address || "");
      setValue("phone", stepTwoFormData.phone || "");
    }
  }, [stepTwoFormData, setValue]);

  // Watch form fields and update context on value change
  const stepTwoFormValues = watch();
  useEffect(() => {
    updateStepTwoFormData(stepTwoFormValues);
  }, [stepTwoFormValues, updateStepTwoFormData]);

  return (
    <div>
      <h1>EMI JC Step Two</h1>
      <Box>
        <TextField
          label="Address"
          name="address"
          {...register("address")}
          fullWidth
        />
        <TextField
          label="Phone Number"
          name="phone"
          {...register("phone")}
          fullWidth
        />
      </Box>
    </div>
  );
}
