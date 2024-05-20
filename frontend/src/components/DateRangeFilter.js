import React, { useEffect, useState } from 'react'

import 'react-date-range/dist/styles.css'; // main css file
import 'react-date-range/dist/theme/default.css'; // theme css file

import { DateRangePicker } from 'react-date-range';
import { addDays, format } from 'date-fns';
import { Button, Grid, IconButton, Tooltip, } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import dayjs from 'dayjs';

import '../css/dateRange.css'

export default function DateRangeFilter({ onClickDateRangeSelectDoneButton, onClickDateRangeSelectClearButton }) {

  const [openDateRange, setOpenDateRange] = useState(false)
  const [selectedDateRange, setSelectedDateRange] = useState('')
  const [buttonText, setButtonText] = useState('Select Date Range')


  const [date, setDate] = useState([{
    startDate: new Date(),
    endDate: addDays(new Date(), 7),
    key: 'selection'
  }])


  const handleOpenDateRangeCalendar = () => {
    setOpenDateRange((prev) => !prev)
  }


  const handleDateRangeChange = (ranges) => {
    setDate([ranges.selection])
    // const selectedRange = `${dayjs(ranges.selection.startDate).format('DD-MM-YYYY')} - ${dayjs(ranges.selection.endDate).format('DD-MM-YYYY')}`;
    const selectedRange = {
      startDate: ranges.selection.startDate,
      endDate: ranges.selection.endDate
    };
    setSelectedDateRange(selectedRange)

    setButtonText(`${dayjs(selectedRange.startDate).format('DD-MM-YYYY')} to ${dayjs(selectedRange.endDate).format('DD-MM-YYYY')}`)

  }

  const clearSelectedDateRange = (event) => {
    setOpenDateRange(false);
    setDate([{
      startDate: new Date(),
      endDate: addDays(new Date(), 7),
      key: 'selection'
    }]);
    setSelectedDateRange('');
    setButtonText('Select Date Range')

    onClickDateRangeSelectClearButton()
  }

  const handleDone = () => {
    onClickDateRangeSelectDoneButton(selectedDateRange);
    setOpenDateRange(false);
  };

  return (

    <div className='date-range-filter'>
      <Grid container spacing={1} alignItems="center">
        <Grid item>
          <Button
            className='button-to-open-calendar'
            variant='outlined'
            onClick={handleOpenDateRangeCalendar}
          >
            {buttonText}
          </Button>
        </Grid>

        {selectedDateRange && (
          <Grid item>
            <Tooltip title="Clear Date Filter">
              <IconButton
                color="red"
                size="large"
                onClick={clearSelectedDateRange}
              >
                <ClearIcon />
              </IconButton>
            </Tooltip>
          </Grid>
        )}
      </Grid>

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

          <Grid item container justifyContent="flex-end" sx={{ backgroundColor: 'white' }}>
            <Button onClick={handleDone}> Done </Button>
            <Button sx={{ color: 'red' }} onClick={clearSelectedDateRange}> Clear </Button>
          </Grid>
        </div>
      )}
    </div>

  )
}

