import React, { useState } from 'react'
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';

import 'react-date-range/dist/styles.css'; // main css file
import 'react-date-range/dist/theme/default.css'; // theme css file

import { DateRangePicker } from 'react-date-range';
import { addDays } from 'date-fns';

export default function DateRangeFilter() {

  const [state, setState] = useState([
    {
      startDate: new Date(),
      endDate: addDays(new Date(), 7),
      key: 'selection'
    }
  ]);

  return (

    <DateRangePicker
      onChange={item => setState([item.selection])}
      showSelectionPreview={true}
      moveRangeOnFirstSelection={false}
      months={2}
      ranges={state}
      direction="horizontal"
    />
  )
}
