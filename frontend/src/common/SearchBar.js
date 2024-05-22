import React from 'react'
import { IconButton, InputAdornment, TextField } from '@mui/material'
import ClearIcon from '@mui/icons-material/Clear';

export default function SearchBar({ placeholder, searchInputText, onChangeOfSearchInput, onClearSearchInput }) {

  return (

    //Note:While using this prop names in another page, Use the same prop names. Otherwise it will throw the errors

    <TextField
      variant='outlined'
      // sx={{ width: '50%' }}
      fullWidth
      placeholder={placeholder}
      value={searchInputText}
      onChange={onChangeOfSearchInput}
      InputProps={{
        endAdornment: (
          <IconButton onClick={onClearSearchInput}>
            <ClearIcon />
          </IconButton>
        )
      }}
    />
  )
}
