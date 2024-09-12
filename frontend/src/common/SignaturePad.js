import React, { useRef, useState } from "react";
import { Box, Button, Dialog, DialogActions, Grid } from "@mui/material";
import SignaturePad from "react-signature-canvas";
import "../css/signaturePad.css";

const SignaturePadComponent = () => {
  const [openSignDialog, setOpenSignDialog] = useState(false);
  const [signatureURL, setSignatureURL] = useState(null);

  const signCanvas = useRef({});

  const clearSignature = () => signCanvas.current.clear();

  //   const saveSignature = () =>
  //     console.log(signCanvas.current.getTrimmedCanvas().toDataURL("image/png"));

  const saveSignature = () =>
    setSignatureURL(
      signCanvas.current.getTrimmedCanvas().toDataURL("image/png")
    );
  console.log("signature-->", signatureURL);

  const handleInsertSignature = () => {
    alert("Signture Inserted");
  };

  const handleCancelSignature = () => {
    setSignatureURL(null);
    // setOpenSignDialog(false);
  };

  return (
    <>
      <Grid container>
        <Button variant="contained" onClick={() => setOpenSignDialog(true)}>
          Open Signature
        </Button>

        <Dialog open={openSignDialog} close={() => setOpenSignDialog(false)}>
          <SignaturePad
            ref={signCanvas}
            canvasProps={{ className: "signatureCanvas" }}
          />

          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <DialogActions>
              <Button variant="contained" onClick={saveSignature}>
                Save
              </Button>
              <Button variant="contained" onClick={clearSignature}>
                Clear
              </Button>
              <Button
                variant="contained"
                onClick={() => setOpenSignDialog(false)}
              >
                Close
              </Button>
            </DialogActions>
          </Box>
          <br />

          {signatureURL ? (
            <img
              src={signatureURL}
              alt="Signature"
              style={{
                display: "block",
                margin: "0 auto",
                border: "1px solid black",
                width: "150px",
              }}
            />
          ) : null}

          {signatureURL ? (
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <DialogActions>
                <Button variant="contained" onClick={handleInsertSignature}>
                  Add
                </Button>
                <Button variant="contained" onClick={handleCancelSignature}>
                  Cancel
                </Button>
              </DialogActions>
            </Box>
          ) : null}
        </Dialog>
      </Grid>
    </>
  );
};

export default SignaturePadComponent;
