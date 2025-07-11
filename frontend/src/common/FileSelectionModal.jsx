import {
  Dialog,
  DialogTitle,
  DialogContent,
  RadioGroup,
  List,
  ListItem,
  FormControlLabel,
  Radio,
  Button,
  DialogActions,
  Typography,
} from "@mui/material";
import { useState } from "react";

const FileSelectionModal = ({
  open,
  onClose,
  title = "Select a File to View",
  options = [],
  onSelect,
  message = "",
}) => {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const handleConfirm = () => {
    if (selectedIndex !== null && options[selectedIndex]) {
      onSelect(options[selectedIndex], selectedIndex);
      onClose();
    }
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {message && (
          <Typography variant="body1" sx={{ whiteSpace: "pre-line", mb: 1 }}>
            {message}
          </Typography>
        )}
        <RadioGroup
          value={selectedIndex}
          onChange={(e) => setSelectedIndex(parseInt(e.target.value))}
          row
        >
          <List>
            {options.map((option, index) => (
              <ListItem
                key={index}
                button
                onClick={() => setSelectedIndex(index)}
              >
                <FormControlLabel
                  value={index}
                  control={<Radio />}
                  label={typeof option === "string" ? option : option.name}
                />
              </ListItem>
            ))}
          </List>
        </RadioGroup>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={selectedIndex === null}
        >
          View
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileSelectionModal;
