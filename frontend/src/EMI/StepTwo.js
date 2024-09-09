import React, { useContext, useEffect } from "react";
import { EMIJCContext } from "./EMIJCContext";
import { useForm } from "react-hook-form";
import { Box, TextField } from "@mui/material";
import _ from "lodash";

export default function EMIJC_StepTwo() {
  //Import the respective context:
  const { stepTwoFormData, updateStepTwoFormData } = useContext(EMIJCContext);

  const { register, setValue, watch } = useForm();

  // When the component mounts, populate the form fields with context data
  useEffect(() => {
    if (stepTwoFormData) {
      _.forEach(stepTwoFormData, (value, key) => {
        setValue(key, value || "");
      });

      //Alternate method is:
      // const updatedStepOneFormValues = _.mapValues(stepTwoFormData, (value) => value || "");
      // setValue(updatedStepOneFormValues);
    }
  }, [stepTwoFormData, setValue]);

  // Watch form fields and update context on value change
  const stepTwoFormValues = watch();

  // Only update context if form data changes
  useEffect(() => {
    if (!_.isEqual(stepTwoFormValues, stepTwoFormData)) {
      updateStepTwoFormData(stepTwoFormValues);
    }
  }, [stepTwoFormValues, stepTwoFormData, updateStepTwoFormData]);

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
