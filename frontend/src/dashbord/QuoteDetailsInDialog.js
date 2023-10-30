import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'
import React, { useState } from 'react'

export default function QuoteDetailsInDialog() {

    const [isQuoteDialogOpen, setQuoteDialogOpen] = useState(true)

    return (
        <div>
            <Dialog>
                <DialogTitle> Quotation Data </DialogTitle>

                <DialogContent>
                    <DialogContentText> Quotation Data of the ID </DialogContentText>
                </DialogContent>

                <DialogActions>
                    <Button>Edit</Button>
                    <Button>Print</Button>
                    <Button>Close</Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}
