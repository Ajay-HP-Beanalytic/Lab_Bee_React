import { forwardRef, useRef } from "react";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";

const SearchBarUpdated = forwardRef(
  (
    { placeholder, searchInputText, onChangeOfSearchInput, onClearSearchInput },
    ref
  ) => {
    const inputRef = useRef(null);
    const textFieldRef = ref || inputRef;

    const handleClear = () => {
      onClearSearchInput();
      // Keep focus after clearing
      setTimeout(() => {
        if (textFieldRef.current) {
          textFieldRef.current.focus();
        }
      }, 0);
    };

    return (
      <TextField
        ref={textFieldRef}
        variant="outlined"
        fullWidth
        placeholder={placeholder}
        value={searchInputText || ""}
        onChange={onChangeOfSearchInput}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={handleClear}>
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          mb: 2,
          "& .MuiOutlinedInput-root": {
            backgroundColor: "white",
          },
        }}
      />
    );
  }
);

SearchBarUpdated.displayName = "SearchBar";
export default SearchBarUpdated;
