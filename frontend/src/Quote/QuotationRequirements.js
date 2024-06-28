// In this page we are importing all the necessary components which are require to create or make a quotation such as 'Customer/Company details', 'Item soft modules', So that all the necessary components will be available in a single page

import React, { useContext } from "react";
import AddCustomerDetails from "./AddCustomerDetails";
import AddModulesAndTests from "./AddModulesAndTests";
import { Box, Divider, Grid, Typography } from "@mui/material";
import { UserContext } from "../Pages/UserContext";

export default function QuotationRequirements() {
  const { loggedInUser, loggedInUserDepartment } = useContext(UserContext);

  return (
    <>
      <Typography
        variant="h4"
        sx={{ textDecoration: "underline", color: "#003366" }}
      >
        {" "}
        Quotation Requirements{" "}
      </Typography>
      <br />
      <AddCustomerDetails />
      <br />
      <br />
      {loggedInUserDepartment !== "Marketing" && <AddModulesAndTests />}
    </>
  );
}
