import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material'
import React, { useState } from 'react'

export default function JCDialogs() {

    const [addTestsDialog, setAddTestsDialog] = useState(true);
    const [tests, setTests] = useState([])


    const handleCancelBtnIsClicked = () => {
        setAddTestsDialog(false)
    }


    return (
        <div>
            <Dialog
                open={addTestsDialog}
                onClose={handleCancelBtnIsClicked}
                aria-labelledby="quotation_title-dialog"
            >

                <DialogTitle id="quotation_title-dialog">Enter Quotation Title And Logo</DialogTitle>
                <DialogContent>
                    <TextField
                        sx={{ minWidth: '400px', borderRadius: 3 }}
                        value={tests}
                        onChange={(e) => setTests(e.target.value)}
                        label="Quotation Title"
                        margin="normal"
                        fullWidth
                        variant="outlined"
                        autoComplete="on"
                    />


                    {/* <>
                      <h4>Select the image: </h4>
                      <FormControl ref={fileInputRef}>
                          <TextField
                              type="file"
                              accept="image/jpg, image/jpeg, image/png"
                              onChange={handleFileChange}
                          />
                      </FormControl>

                      {companyLogoImage && (
                          <img
                              src={companyLogoImage}
                              alt="Company Logo"
                              style={{ maxWidth: '100%', marginTop: '10px', borderRadius: '5px' }}
                          />
                      )}
                  </> */}
                </DialogContent>

                <DialogActions sx={{ alignItems: 'center' }}>
                    <Button
                        variant="contained"
                        color="secondary"
                        type="submit"
                    //onClick={onSubmitQuoteTitleButton}
                    >
                        Save
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                    //onClick={handleCancelBtnIsClicked}
                    >
                        Cancel
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    )
}
