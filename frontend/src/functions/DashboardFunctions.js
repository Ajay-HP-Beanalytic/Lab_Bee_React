
import React from 'react'
import { Accordion, AccordionDetails, AccordionSummary, List, ListItem, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';


import ChartDataLabels from 'chartjs-plugin-datalabels';

import {
    Chart as ChartJS,

    ArcElement,
    BarElement, CategoryScale, LinearScale,

    Tooltip, Legend, Title, SubTitle
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';




//Import ArcElement for the piechart
//Import BarElement, CategoryScale, LinearScale for the barchart 

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Title, SubTitle, Tooltip, Legend);

ChartJS.register(ChartDataLabels);


// Important : React components should start with an uppercase letter to distinguish them from regular HTML elements.

//Function to create the kpi dashboard:
// Function to create the KPI dashboards by passing the title, kpi title, kpi value, kpi list, with custom color
//const accordianTitleString = ''

const CreateKpiCard = ({ kpiTitle, kpiValue, kpiNames, kpiColor, accordianTitleString, kpiIcon }) => (

    <div style={{ padding: '10px' }}>
        <div >
            <Typography variant="h6" fontWeight='bold' align='left'>{kpiTitle}</Typography>
        </div>

        <div style={{ padding: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h1" style={{ color: kpiColor }} align='left'>{kpiValue}</Typography>
            {kpiIcon && React.cloneElement(kpiIcon)}
        </div>
        {kpiNames && kpiNames.length > 0 && (
            <Accordion>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1a-content"
                    id="panel1a-header"
                >
                    <Typography sx={{ fontSize: 'bold', align: 'center' }}>
                        {accordianTitleString}
                    </Typography>
                </AccordionSummary>

                <AccordionDetails >
                    <List sx={{ padding: '2px', }}>
                        {kpiNames.map((name, index) => (
                            <ListItem key={index} sx={{ fontSize: 'bold', align: 'center' }}>
                                <Typography variant="subtitle1">
                                    {name}
                                </Typography>
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
    <Pie
        data={data}
        options={options}
    />
)

export { CreatePieChart };


// Function to create a vertical barchart:
const CreateBarChart = ({ data, options }) => (
    <Bar
        data={data}
        options={options}
    />
);

export { CreateBarChart };









export default function DashboardFunctions() {

    return (
        <>
            <CreateKpiCard
                kpiTitle=''
                kpiValue=''
                kpiNames=''
                kpiColor=''
                accordianTitleString=''
                kpiIcon={true}
            />


            <CreatePieChart
                data=''
                options=''
            />


            <CreateBarChart
                data=''
                options=''
            />

        </>
    )

}









//Function to create the kpi dashboard:
// const CreateKpiCard = ({ kpiTitle, kpiValue, kpiNames, kpiColor, accordianTitleString }) => (
// <div style={{ padding: '10px', border: '1px solid #ccc' }}>
//     <Typography variant="h5" sx={{ fontSize: 'bold' }} align='center'>{kpiTitle}</Typography>
//     <Typography variant="h1" style={{ color: kpiColor }} align='center'>{kpiValue}</Typography>


//     {/* {kpiNames && kpiNames.length > 0 && (
//         <ul style={{ margin: 0, padding: '10px' }}>
//             {kpiNames.map((name, index) => (
//                 // <li key={index}>{name}</li>
//                 <Typography variant='subtitle1' sx={{ fontSize: 'bold' }} key={index}>{name}</Typography>
//             ))}
//         </ul>
//     )} */}

//     {kpiNames && kpiNames.length > 0 && (
//         <List sx={{ padding: '2px' }}>
//             {kpiNames.map((name, index) => (
//                 <ListItem key={index} sx={{ fontSize: 'bold', align: 'center' }}>
//                     <Typography variant="subtitle1" >
//                         {name}
//                     </Typography>
//                 </ListItem>
//             ))}
//         </List>
//     )}
// </div>



// <div style={{ padding: '10px' }}>
//     <Typography variant="h5" sx={{ fontSize: 'bold' }} align='center'>{kpiTitle}</Typography>
//     <Typography variant="h1" style={{ color: kpiColor }} align='center'>{kpiValue}</Typography>

//     {kpiNames && kpiNames.length > 0 && (
//         <Accordion>
//             <AccordionSummary
//                 expandIcon={<ExpandMoreIcon />}
//                 aria-controls="panel1a-content"
//                 id="panel1a-header"
//             >
//                 <Typography sx={{ fontSize: 'bold', align: 'center' }}>
//                     {accordianTitleString}
//                 </Typography>
//             </AccordionSummary>
//             <AccordionDetails >
//                 <List sx={{ padding: '2px' }}>
//                     {kpiNames.map((name, index) => (
//                         <ListItem key={index} sx={{ fontSize: 'bold', align: 'center' }}>
//                             <Typography variant="subtitle1">
//                                 {name}
//                             </Typography>
//                         </ListItem>
//                     ))}
//                 </List>
//             </AccordionDetails>
//         </Accordion>
//     )}
// </div>
//);






