// In this page we are importing all the necessary components which are require to create or make a quotation such as 'Customer/Company details', 'Item soft modules', So that all the necessary components will be available in a single page

import { useContext } from "react";
import AddCustomerDetails from "./AddCustomerDetails";
import AddModulesAndTests from "./AddModulesAndTests";
import { Card, Typography } from "@mui/material";
import { UserContext } from "../Pages/UserContext";
import PaySlipDashboard from "../HR/paySlipDashboard";
import TestHoursCalculator from "./TestHoursCalculator";

export default function QuotationRequirements() {
  const { loggedInUserDepartment } = useContext(UserContext);

  return (
    <>
      <Typography variant="h4" sx={{ color: "#003366", mb: "10px" }}>
        {" "}
        Quotation Requirements{" "}
      </Typography>
      <Card sx={{ width: "100%", padding: "20px" }}>
        <AddCustomerDetails />
      </Card>
      <br />
      <Card sx={{ width: "100%", padding: "20px" }}>
        {loggedInUserDepartment !== "Marketing" && <AddModulesAndTests />}
      </Card>

      <br />

      {/* <PaySlipDashboard /> */}
      {/* <TestHoursCalculator /> */}
    </>
  );
}
