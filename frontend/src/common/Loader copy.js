import React, { useEffect, useState } from 'react'
import { Backdrop, Box, CircularProgress } from '@mui/material'


export default function Loader() {

  const [open, setOpen] = useState(false)

  return (

    <Backdrop
      sx={{
        color: "#fff",
        zIndex: 10000,
        height: "100vh"
      }}
      open
    >
      <CircularProgress />
    </Backdrop>
  )
}


