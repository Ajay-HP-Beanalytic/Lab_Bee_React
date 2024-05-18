import React, { useState } from 'react'

import 'react-date-range/dist/styles.css'; // main css file
import 'react-date-range/dist/theme/default.css'; // theme css file

import { DateRangePicker } from 'react-date-range';
import { addDays, format } from 'date-fns';
import { Button, Grid, } from '@mui/material';
import dayjs from 'dayjs';

import '../css/dateRange.css'

export default function DateRangeFilter({ onClickDateRangeSelectDoneButton, onClickDateRangeSelectClearButton }) {

  const [openDateRange, setOpenDateRange] = useState(false)
  const [selectedDateRange, setSelectedDateRange] = useState('')



  const handleOpenDateRangeCalendar = () => {
    setOpenDateRange((prev) => !prev)

  }

  const [date, setDate] = useState([{
    startDate: new Date(),
    endDate: addDays(new Date(), 7),
    key: 'selection'
  }])


  const handleDateRangeChange = (ranges) => {
    setDate([ranges.selection])
    const selectedRange = `${dayjs(ranges.selection.startDate).format('DD-MM-YYYY')} - ${dayjs(ranges.selection.endDate).format('DD-MM-YYYY')}`;
    setSelectedDateRange(selectedRange)

  }

  const clearSelectedDateRange = (event) => {
    setOpenDateRange(false);
    setDate([{
      startDate: new Date(),
      endDate: addDays(new Date(), 7),
      key: 'selection'
    }]);

    onClickDateRangeSelectClearButton()

  }

  const handleDone = () => {
    onClickDateRangeSelectDoneButton(selectedDateRange);
    setOpenDateRange(false);
  };

  const buttonText = openDateRange
    ? `${dayjs(date.startDate).format('DD-MM-YYYY')} - ${dayjs(date.endDate).format('DD-MM-YYYY')}`
    : 'Select Date Range';

  return (

    <div className='date-range-filter'>
      <Button
        className='button-to-open-calendar'
        variant='outlined'
        onClick={handleOpenDateRangeCalendar}
      >
        {buttonText}
      </Button>

      <Grid container>
        {openDateRange && (
          <div className='date-range-picker'>
            <DateRangePicker
              className='dateRange'
              onChange={handleDateRangeChange}
              ranges={date}
              showSelectionPreview={true}
              direction="horizontal"
              months={2}
              inputRanges={[]}
              staticRanges={[]}
            />

            <Grid item container justifyContent="flex-end" sx={{ backgroundColor: 'white' }} >
              <Button onClick={handleDone}> Done </Button>
              <Button sx={{ color: 'red' }} onClick={clearSelectedDateRange}> Clear </Button>
            </Grid>

          </div>
        )}
      </Grid>
    </div>
  )
}

