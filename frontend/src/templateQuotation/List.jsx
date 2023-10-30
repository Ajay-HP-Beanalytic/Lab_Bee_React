
import React, { useState } from 'react'
import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { Card, Stack, CardContent } from '@mui/material';
import { styled } from '@mui/material/styles';
//import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
//import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import Environmental from '../templateQuotation/Environmental'
import ReliabilityQuotation from './Reliability';
import ItemSoftQuotation from './ItemSoft';





const StyledTabs = styled((props) => (
  <Tabs
    {...props}
    TabIndicatorProps={{ children: <span className="MuiTabs-indicatorSpan" /> }}
  />
))({
  '& .MuiTabs-indicator': {
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  '& .MuiTabs-indicatorSpan': {
    maxWidth: 40,
    width: '100%',
    backgroundColor: '#635ee7',
  },
});

const StyledTab = styled((props) => <Tab disableRipple {...props} />)(
  ({ theme }) => ({
    textTransform: 'none',
    fontWeight: theme.typography.fontWeightRegular,
    fontSize: theme.typography.pxToRem(15),
    marginRight: theme.spacing(1),
    color: "#141414",
    fontWeight: "400",
    '&.Mui-selected': {
      color: '#0c828f',
    },
    '&.Mui-focusVisible': {
      backgroundColor: "#30c1d1",
    },
  }),
);


function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function QuotaionTemplates() {
  const [value, setValue] = useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (

    <Card>
      <CardContent>
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <StyledTabs value={value} onChange={handleChange} aria-label="basic tabs example">
              <StyledTab label="Environmental" {...a11yProps(0)} />
              <StyledTab label="Reliability" {...a11yProps(1)} />
              <StyledTab label="EMI & EMC" {...a11yProps(2)} />
              <StyledTab label="Item Soft" {...a11yProps(3)} />
            </StyledTabs>
          </Box>
          <CustomTabPanel value={value} index={0}>
            <Environmental />
          </CustomTabPanel>

          <CustomTabPanel value={value} index={1}>
            {/* <MyTable /> */}
            <ReliabilityQuotation />
          </CustomTabPanel>

          <CustomTabPanel value={value} index={2}>
            Quotation for EMI & EMC tests
          </CustomTabPanel>

          <CustomTabPanel value={value} index={3}>
            <ItemSoftQuotation />
          </CustomTabPanel>

        </Box>
      </CardContent>
    </Card>
  );
}