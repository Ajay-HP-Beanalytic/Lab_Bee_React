import React, { useContext, useEffect } from "react";
import { EMIJCContext } from "./EMIJCContext";
import { useForm } from "react-hook-form";
import { Card, Grid, Typography } from "@mui/material";
import _ from "lodash";
import RenderComponents from "../functions/RenderComponents";
import dayjs from "dayjs";

export default function EMIJCStepThree() {
  //Import the respective context:
  const { stepThreeFormData, updateStepThreeFormData } =
    useContext(EMIJCContext);

  const { control, register, setValue, watch } = useForm();

  const jcStatusFieldsPartOne = [
    // {
    //   label: "Observation Form",
    //   name: "observationForm",
    //   type: "select",
    //   options: [
    //     { label: "CS101", value: "CS101" },
    //     { label: "CS114", value: "CS114" },
    //     { label: "CS115", value: "CS115" },
    //     { label: "CS116", value: "CS116" },
    //     { label: "CS118", value: "CS118" },
    //     { label: "RS101", value: "CS118" },
    //     { label: "RS103", value: "RS103" },
    //   ],
    //   width: "100%",
    // },
    {
      label: "JC Status",
      name: "jcStatus",
      type: "select",
      options: [
        { label: "Open", value: "Open" },
        { label: "Running", value: "Running" },
        { label: "Closed", value: "Closed" },
      ],
      width: "100%",
    },
    {
      label: "JC CLosed Date",
      name: "jcClosedDate",
      type: "datePicker",
      width: "100%",
    },
    {
      label: "Observations/Remarks",
      name: "observations",
      type: "textArea",
      width: "100%",
    },
  ];

  // When the component mounts, populate the form fields with context data
  useEffect(() => {
    if (stepThreeFormData) {
      // _.forEach(stepThreeFormData, (value, key) => {
      //   setValue(key, value || "");
      // });

      _.forEach(stepThreeFormData, (value, key) => {
        if (key === "jcClosedDate") {
          // Convert date strings to Day.js objects
          setValue(key, value ? dayjs(value) : null);
        } else {
          setValue(key, value || "");
        }
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
    <>
      <Card sx={{ width: "100%", mt: "10px", mb: "10px" }}>
        {/* <Typography variant="h5" sx={{ mb: "5px" }}>
          Observation Forms
        </Typography> */}

        <Grid
          container
          spacing={2}
          alignItems="stretch"
          justifyContent="center"
          sx={{ padding: "10px" }}
        >
          <Grid item xs={12} sm={6} md={6}>
            <RenderComponents
              fields={jcStatusFieldsPartOne}
              register={register}
              control={control}
              watch={watch}
              setValue={setValue}
            />
          </Grid>
        </Grid>
      </Card>
    </>
  );
}
