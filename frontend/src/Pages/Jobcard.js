import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';

const Jobcard = () => {

  const [value, setValue] = useState(); // Initialize the active tab

  //const handleChange = (event, newValue) => {
  //  setValue(newValue); // Update the active tab when a tab is clicked
  //};
  //
  return (
    <>
      <Box height={100} width={1000} />
      <Typography variant='h5'> Job Card</Typography>

    </>
  )
}

export default Jobcard;