
import React from 'react'
import { Button, Tooltip } from '@mui/material';
import { Link } from 'react-router-dom';

// Function to create a button with a link:
const CreateButtonWithLink = ({ title, color, to, children }) => {
    return (
        <Tooltip title={title} arrow>
            <Button
                variant="contained"
                style={{ backgroundColor: 'primary' }}
                sx={{ borderRadius: 3, margin: 0.5 }}
                component={Link}
                to={to}
            >
                {children}
            </Button>
        </Tooltip>
    );
};

export { CreateButtonWithLink };



// In order to export the created functions using a main function
export default function ComponentsFunctions() {

    return (
        <>
            <CreateButtonWithLink />

        </>
    )
}
