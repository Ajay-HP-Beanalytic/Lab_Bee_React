import React, { useEffect, useState } from 'react'
import { Backdrop, Box, CircularProgress } from '@mui/material'
import { EVENT_CONSTANTS, subscribe, unsubscribe } from './CustomEvents';


export default function Loader() {
  const [open, setOpen] = useState(false)

  //Use effect function to activate and deactivate the loader
  useEffect(() => {
    const handleLoader = (event) => {
      setOpen(event.detail);
    };

    subscribe(EVENT_CONSTANTS.openLoader, handleLoader);

    return () => {
      unsubscribe(EVENT_CONSTANTS.openLoader, handleLoader);
    };
  }, []);

  if (open) {
    return (
      <Backdrop
        sx={{
          color: "#fff",
          zIndex: 10000,
          height: "100vh"
        }}
        open={true}
      >
        <CircularProgress />
      </Backdrop>
    )
  }
  return null
}
