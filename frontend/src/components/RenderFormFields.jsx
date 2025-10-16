import {
  TextField,
  MenuItem,
  FormControl,
  FormLabel,
  Box,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
} from "@mui/material";
import { DatePicker, DateTimePicker, TimePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

/**
 * Zustand-based Form Fields Renderer
 * Similar to RenderComponents.js but works with Zustand store instead of React Hook Form
 *
 * @param {Object} props
 * @param {Array} props.fields - Array of field configurations
 * @param {Object} props.store - Zustand store instance with state and setters
 *
 * Field Configuration Example:
 * {
 *   name: "companyName",
 *   label: "Company Name",
 *   type: "textField",
 *   stateKey: "companyName",      // Key in Zustand store
 *   setterKey: "setCompanyName",   // Setter function in Zustand store
 *   width: "100%",
 *   multiline: false,
 *   rows: 1,
 *   options: [],                   // For select/radio fields
 *   inputProps: {},                // Additional input props
 * }
 */
const RenderFormFields = ({ fields, store }) => {
  return (
    <>
      {fields.map((field) => {
        const fieldWidth = field.width || "100%";
        const value = store[field.stateKey] || "";
        const setValue = store[field.setterKey];

        switch (field.type) {
          case "textField":
            return (
              <TextField
                key={field.name}
                label={field.label}
                name={field.name}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                fullWidth
                multiline={field.multiline || false}
                rows={field.rows || 1}
                inputProps={field.inputProps || {}}
                sx={{ mb: "10px", padding: "2px", width: fieldWidth }}
              />
            );

          case "number":
            return (
              <TextField
                key={field.name}
                label={field.label}
                name={field.name}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                fullWidth
                type="number"
                inputProps={field.inputProps || {}}
                sx={{ mb: "10px", padding: "2px", width: fieldWidth }}
              />
            );

          case "tel":
            return (
              <TextField
                key={field.name}
                label={field.label}
                name={field.name}
                value={value}
                onChange={(e) => {
                  const input = e.target.value;
                  // Validate phone number format (numbers, +, -, max 15 chars)
                  if (/^[\d+-]{0,15}$/.test(input)) {
                    setValue(input);
                  }
                }}
                fullWidth
                type="tel"
                inputProps={{
                  inputMode: "numeric",
                  pattern: "[0-9+\\-]*",
                  maxLength: 15,
                  ...(field.inputProps || {}),
                }}
                sx={{ mb: "10px", padding: "2px", width: fieldWidth }}
              />
            );

          case "email":
            return (
              <TextField
                key={field.name}
                label={field.label}
                name={field.name}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                fullWidth
                type="email"
                inputProps={field.inputProps || {}}
                sx={{ mb: "10px", padding: "2px", width: fieldWidth }}
              />
            );

          case "textArea":
            return (
              <TextField
                key={field.name}
                label={field.label}
                name={field.name}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                fullWidth
                multiline
                rows={field.rows || 4}
                inputProps={field.inputProps || {}}
                sx={{ mb: "10px", padding: "2px", width: fieldWidth }}
              />
            );

          case "datePicker":
            return (
              <LocalizationProvider key={field.name} dateAdapter={AdapterDayjs}>
                <DatePicker
                  label={field.label}
                  value={value ? dayjs(value) : null}
                  onChange={(newValue) => setValue(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  format="DD-MM-YYYY"
                  sx={{ mb: "10px", padding: "2px", width: fieldWidth }}
                />
              </LocalizationProvider>
            );

          case "dateTimePicker":
            return (
              <LocalizationProvider key={field.name} dateAdapter={AdapterDayjs}>
                <DateTimePicker
                  label={field.label}
                  value={value ? dayjs(value) : null}
                  onChange={(newValue) => setValue(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  format="DD-MM-YYYY HH:mm"
                  sx={{ mb: "10px", padding: "2px", width: fieldWidth }}
                />
              </LocalizationProvider>
            );

          case "timePicker":
            return (
              <LocalizationProvider key={field.name} dateAdapter={AdapterDayjs}>
                <TimePicker
                  label={field.label}
                  value={value ? dayjs(value) : null}
                  onChange={(newValue) => setValue(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  format="HH:mm"
                  sx={{ mb: "10px", padding: "2px", width: fieldWidth }}
                />
              </LocalizationProvider>
            );

          case "select":
            return (
              <FormControl
                key={field.name}
                fullWidth
                sx={{ mb: "10px", padding: "2px", width: fieldWidth }}
              >
                {field.showLabel && (
                  <FormLabel component="legend">{field.label}</FormLabel>
                )}
                <TextField
                  select
                  label={field.showLabel ? "" : field.label}
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    if (typeof field.onChange === "function") {
                      field.onChange(e);
                    }
                  }}
                  fullWidth
                >
                  {Array.isArray(field.options) &&
                    field.options.map((option) => {
                      if (typeof option === "string") {
                        return (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        );
                      } else {
                        const itemValue = option.value || option.id;
                        const itemLabel = option.label || option.name;
                        return (
                          <MenuItem key={itemValue} value={itemValue}>
                            {itemLabel}
                          </MenuItem>
                        );
                      }
                    })}
                </TextField>
              </FormControl>
            );

          case "radio":
            return (
              <Box key={field.name} mt="10px" sx={{ width: fieldWidth }}>
                <FormLabel component="legend">{field.label}</FormLabel>
                <RadioGroup
                  row
                  aria-label={field.label}
                  name={field.name}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  sx={{ mb: "10px", padding: "2px" }}
                >
                  {field.options.map((option) => {
                    const optionValue =
                      typeof option === "string" ? option : option.value;
                    const optionLabel =
                      typeof option === "string" ? option : option.label;
                    return (
                      <FormControlLabel
                        key={optionValue}
                        value={optionValue}
                        control={<Radio />}
                        label={optionLabel}
                      />
                    );
                  })}
                </RadioGroup>
              </Box>
            );

          case "checkbox":
            return (
              <Box
                key={field.name}
                mt="10px"
                sx={{ mb: "10px", width: fieldWidth }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={value || false}
                      onChange={(e) => setValue(e.target.checked)}
                    />
                  }
                  label={field.label}
                />
              </Box>
            );

          default:
            return null;
        }
      })}
    </>
  );
};

export default RenderFormFields;
