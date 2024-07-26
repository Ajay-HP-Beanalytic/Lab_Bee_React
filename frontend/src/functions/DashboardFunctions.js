import React from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CountUp from "react-countup";

import ChartDataLabels from "chartjs-plugin-datalabels";

import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
  SubTitle,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";

//Import ArcElement for the piechart
//Import BarElement, CategoryScale, LinearScale for the barchart

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  SubTitle,
  Tooltip,
  Legend
);

ChartJS.register(ChartDataLabels);

// Important : React components should start with an uppercase letter to distinguish them from regular HTML elements.

//Function to create the kpi dashboard:
// Function to create the KPI dashboards by passing the title, kpi title, kpi value, kpi list, with custom color
//const accordianTitleString = ''

const CreateKpiCard = ({
  kpiTitle,
  kpiValue,
  kpiNames,
  kpiColor,
  accordianTitleString,
  kpiIcon,
}) => (
  <div style={{ padding: "10px" }}>
    <div>
      <Typography variant="subtitle1" fontWeight="bold" align="left">
        {kpiTitle}
      </Typography>
    </div>

    <div
      style={{
        padding: "10px",
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <Typography variant="h4" style={{ color: kpiColor }} align="left">
        {kpiValue}
      </Typography>
      {kpiIcon && React.cloneElement(kpiIcon)}
    </div>
    {kpiNames && kpiNames.length > 0 && (
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography sx={{ fontSize: "bold", align: "center" }}>
            {accordianTitleString}
          </Typography>
        </AccordionSummary>

        <AccordionDetails>
          <List sx={{ padding: "2px" }}>
            {kpiNames.map((name, index) => (
              <ListItem key={index} sx={{ fontSize: "bold", align: "center" }}>
                <Typography variant="subtitle1">{name}</Typography>
              </ListItem>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>
    )}
  </div>
);

export { CreateKpiCard }; // Export the CreateKpiCard function

// Function to create a pie chart:
const CreatePieChart = ({ data, options }) => (
  <Pie data={data} options={options} />
);

export { CreatePieChart };

// Function to create a vertical barchart:
const CreateBarChart = ({ data, options }) => (
  <Bar data={data} options={options} />
);

export { CreateBarChart };

const CreateKpiCardWithAccordion = ({ totalValue, categoryWiseValue }) => {
  return (
    <Card
      elevation={3}
      sx={{
        backgroundColor: "#ffffff",
        borderRadius: "15px",
        overflow: "hidden",
        boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
        margin: "20px",
      }}
    >
      <CardContent sx={{ padding: "30px", backgroundColor: "#d6d6c2" }}>
        <Typography
          variant="h4"
          component="div"
          sx={{
            textAlign: "center",
            marginBottom: "10px",
            fontWeight: "bold",
            // color: '#3f51b5'
          }}
        >
          Total Revenue
        </Typography>
        <Typography
          variant="h3"
          component="div"
          sx={{
            textAlign: "center",
            color: "#3f51b5",
            marginBottom: "20px",
          }}
        >
          <CountUp start={0} end={totalValue} delay={1} duration={2} />
        </Typography>
        <Divider sx={{ marginBottom: "15px" }} />
        <Accordion elevation={0}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: "#3f51b5" }} />}
            aria-controls="panel1a-content"
            id="panel1a-header"
            sx={{
              backgroundColor: "#f5f5f5",
              borderRadius: "10px",
              padding: "10px 20px",
            }}
          >
            <Typography variant="h5">Category Wise Details</Typography>
          </AccordionSummary>
          <AccordionDetails
            sx={{ padding: "20px", backgroundColor: "#d1cec1" }}
          >
            {Object.keys(categoryWiseValue).map((category, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <Typography variant="h6" component="div">
                  {category}
                </Typography>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{ color: "#99004d" }}
                >
                  <CountUp
                    start={0}
                    end={categoryWiseValue[category]}
                    delay={1}
                    duration={2}
                  />
                </Typography>
              </Box>
            ))}
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export { CreateKpiCardWithAccordion };

export default function DashboardFunctions() {
  return (
    <>
      <CreateKpiCard
        kpiTitle=""
        kpiValue=""
        kpiNames=""
        kpiColor=""
        accordianTitleString=""
        kpiIcon={true}
      />

      <CreatePieChart data="" options="" />

      <CreateBarChart data="" options="" />

      <CreateKpiCardWithAccordion totalValue="" categoryWiseValue="" />
    </>
  );
}
