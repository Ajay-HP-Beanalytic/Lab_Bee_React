import {
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

export default function CustomModal({
  open,
  onClose,
  title,
  options,
  onDelete,
  onUpdate,
}) {
  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <div style={{ padding: 20 }}>
          <DialogTitle sx={{ color: "#003366" }}>
            <Typography variant="h5" sx={{ color: "#003366" }}>
              {" "}
              {title}{" "}
            </Typography>
          </DialogTitle>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
          <Divider />
          <List>
            <Typography variant="body1">
              {options.map((option, index) => (
                <ListItem key={index}>
                  <ListItemText primary={option.label} />
                </ListItem>
              ))}
            </Typography>
          </List>

          <DialogActions sx={{ justifyContent: "center" }}>
            <Button
              variant="contained"
              sx={{
                mx: 2,
                mb: 1,
                bgcolor: "orange",
                color: "white",
                borderColor: "black",
              }}
              onClick={onDelete}
            >
              DELETE
            </Button>
            <Button
              variant="contained"
              sx={{
                mx: 2,
                mb: 1,
                bgcolor: "orange",
                color: "white",
                borderColor: "black",
              }}
              type="submit"
              onClick={onUpdate}
            >
              {" "}
              UPDATE
            </Button>
          </DialogActions>
        </div>
      </Dialog>
    </>
  );
}
