import React, { useContext, useEffect } from "react";
import { Box, TextField } from "@mui/material";
import { EMIJCContext } from "./EMIJCContext";
import { useForm, useFormContext } from "react-hook-form";

export default function EMIJC_StepOne() {
  //Import the respective context:
  const { stepOneFormData, updateStepOneFormData } = useContext(EMIJCContext);
  const { register, setValue, watch } = useForm();

  // When the component mounts, populate the form fields with context data
  useEffect(() => {
    if (stepOneFormData) {
      setValue("name", stepOneFormData.name || "");
      setValue("description", stepOneFormData.description || "");
    }
  }, [stepOneFormData, setValue]);

  // Watch form fields and update context on value change
  const stepOneFormValues = watch();
  useEffect(() => {
    updateStepOneFormData(stepOneFormValues);
  }, [stepOneFormValues, updateStepOneFormData]);

  return (
    <>
      <h1>EMI JC Step One</h1>

      <Box>
        <TextField label="Name" name="name" {...register("name")} fullWidth />
        <TextField
          label="Description"
          name="description"
          {...register("description")}
          fullWidth
        />
      </Box>
    </>
  );
}
