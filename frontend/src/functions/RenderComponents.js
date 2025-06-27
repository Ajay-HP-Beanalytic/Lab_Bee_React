import {
  Box,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import { Controller } from "react-hook-form";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import SignaturePadComponent from "../common/SignaturePad";

export default function RenderComponents({
  fields,
  register,
  control,
  watch,
  setValue,
}) {
  return (
    <>
      {fields.map((field) => {
        const fieldWidth = field.width || "100%"; // Default to full width if no width specified

        switch (field.type) {
          case "textField":
          case "tel":
            return (
              <TextField
                key={field.name}
                label={field.label}
                name={field.name}
                {...register(field.name)}
                value={watch(field.name) || ""} // Ensure it's never undefined
                fullWidth
                sx={{ mb: "10px", padding: "2px", width: fieldWidth }}
              />
            );

          case "number":
            return (
              <TextField
                key={field.name}
                label={field.label}
                name={field.name}
                {...register(field.name)}
                value={watch(field.name) || ""} // Ensure it's never undefined
                fullWidth
                type="number"
                sx={{ mb: "10px", padding: "2px", width: fieldWidth }}
              />
            );

          case "textArea":
            return (
              <TextField
                key={field.name}
                label={field.label}
                name={field.name}
                {...register(field.name)}
                value={watch(field.name) || ""} // Ensure it's never undefined
                fullWidth
                multiline
                rows={2}
                sx={{ mb: "10px", padding: "2px", width: field.width }}
              />
            );

          case "datePicker":
            return (
              <Controller
                key={field.name}
                name={field.name}
                control={control}
                render={({ field: { onChange, value } }) => (
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label={field.label}
                      value={value || null}
                      onChange={onChange}
                      fullWidth
                      sx={{ mb: "10px", padding: "2px", width: fieldWidth }}
                      renderInput={(params) => <TextField {...params} />}
                      format="DD-MM-YYYY"
                    />
                  </LocalizationProvider>
                )}
              />
            );

          case "dateTimePicker":
            return (
              <Controller
                key={field.name}
                name={field.name}
                control={control}
                render={({ field: { onChange, value } }) => (
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DateTimePicker
                      label={field.label}
                      value={value || null}
                      onChange={onChange}
                      sx={{ mb: "10px", padding: "2px", width: fieldWidth }}
                      fullWidth
                      renderInput={(params) => <TextField {...params} />}
                      format="DD-MM-YYYY HH:mm"
                    />
                  </LocalizationProvider>
                )}
              />
            );

          case "timePicker":
            return (
              <Controller
                key={field.name}
                name={field.name}
                control={control}
                render={({ field: { onChange, value } }) => (
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <TimePicker
                      label={field.label}
                      value={value || null}
                      onChange={onChange}
                      sx={{ mb: "10px", padding: "2px", width: fieldWidth }}
                      fullWidth
                      renderInput={(params) => <TextField {...params} />}
                      format="DD-MM-YYYY HH:mm"
                    />
                  </LocalizationProvider>
                )}
              />
            );

          case "select":
            const selectedValue = watch(field.name); // Watch the value of the select field
            return (
              <TextField
                key={field.name}
                name={field.name}
                select
                label={field.label}
                value={selectedValue || ""} // Set the value to the watched value
                onChange={(e) => setValue(field.name, e.target.value)} // Set the value when the selection changes
                fullWidth
                sx={{ mb: "10px", padding: "2px", width: fieldWidth }}
              >
                {/* {field.options.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.label}
                  </MenuItem>
                ))} */}

                {Array.isArray(field.options) &&
                  field.options.map((option) => {
                    if (typeof option === "string") {
                      // For flat list of strings
                      return (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      );
                    } else {
                      // For object-based options (with id and label)

                      //Determine the value for the MenuItem
                      const itemValue =
                        option.id !== undefined ? option.id : option.id;

                      //Determine the label for the MenuItem
                      const itemDisplay =
                        option.label !== undefined ? option.label : option.name;

                      return (
                        <MenuItem
                          // key={option.id ? option.id : option.label}
                          // value={option.id ? option.id : option.value}

                          key={itemValue}
                          value={itemValue}
                        >
                          {/* {option.label} */}
                          {itemDisplay}
                        </MenuItem>
                      );
                    }
                  })}
              </TextField>
            );

          // case "select":
          //   // Comprehensive field identifier handling
          //   const fieldIdentifier = field.name || field.id;

          //   if (!fieldIdentifier) {
          //     console.error("Select field missing both name and id:", field);
          //     return null; // or some error component
          //   }

          //   const selectedValue = watch(fieldIdentifier);

          //   // Helper function to safely get option value
          //   const getOptionValue = (option) => {
          //     if (typeof option === "string") return option;

          //     // Priority order: id > name > value > text > label
          //     return option.id !== undefined
          //       ? option.id
          //       : option.name !== undefined
          //       ? option.name
          //       : option.value !== undefined
          //       ? option.value
          //       : option.text !== undefined
          //       ? option.text
          //       : option.label !== undefined
          //       ? option.label
          //       : String(option); // Convert to string as fallback
          //   };

          //   // Helper function to safely get option display text
          //   const getOptionDisplay = (option) => {
          //     if (typeof option === "string") return option;

          //     // Priority order: label > name > title > text > id > value
          //     return option.label !== undefined
          //       ? option.label
          //       : option.name !== undefined
          //       ? option.name
          //       : option.title !== undefined
          //       ? option.title
          //       : option.text !== undefined
          //       ? option.text
          //       : option.id !== undefined
          //       ? String(option.id)
          //       : option.value !== undefined
          //       ? String(option.value)
          //       : String(option); // Convert to string as fallback
          //   };

          //   // Debug logging (remove in production)
          //   // if (process.env.NODE_ENV === "development") {
          //   //   console.log(`Select field "${fieldIdentifier}":`, {
          //   //     field,
          //   //     selectedValue,
          //   //     optionsCount: field.options?.length || 0,
          //   //   });
          //   // }

          //   return (
          //     <TextField
          //       key={fieldIdentifier}
          //       name={fieldIdentifier}
          //       select
          //       label={field.label}
          //       value={selectedValue || ""}
          //       onChange={(e) => {
          //         const newValue = e.target.value;
          //         setValue(fieldIdentifier, newValue);

          //         // // Debug logging (remove in production)
          //         // if (process.env.NODE_ENV === "development") {
          //         //   console.log(
          //         //     `Select "${fieldIdentifier}" changed to:`,
          //         //     newValue
          //         //   );
          //         // }
          //       }}
          //       fullWidth
          //       sx={{ mb: "10px", width: fieldWidth }}
          //       // Add these for better UX
          //       error={!!field.error}
          //       helperText={field.error?.message}
          //       required={field.required}
          //     >
          //       {Array.isArray(field.options) ? (
          //         field.options.map((option, index) => {
          //           const itemValue = getOptionValue(option);
          //           const itemDisplay = getOptionDisplay(option);

          //           // Create unique key (important for React rendering)
          //           const itemKey = `${fieldIdentifier}_${itemValue}_${index}`;

          //           return (
          //             <MenuItem key={itemKey} value={itemValue}>
          //               {itemDisplay}
          //             </MenuItem>
          //           );
          //         })
          //       ) : (
          //         <MenuItem disabled>No options available</MenuItem>
          //       )}
          //     </TextField>
          //   );

          case "radio":
            return (
              <Box key={field.name} mt="10px">
                <FormLabel component="legend">{field.label}</FormLabel>
                <RadioGroup
                  row
                  aria-label={field.label}
                  name={field.name}
                  {...register(field.name)}
                  value={watch(field.name) || ""} // Set value to empty string as fallback
                  onChange={(e) => setValue(field.name, e.target.value)}
                  fullWidth
                  sx={{ mb: "10px", padding: "2px", width: fieldWidth }}
                >
                  {field.options.map((option) => (
                    <FormControlLabel
                      key={option}
                      value={option}
                      control={<Radio />}
                      label={option}
                    />
                  ))}
                </RadioGroup>
              </Box>
            );

          case "signaturePad":
            return (
              <div key={field.name} style={{ width: field.width }}>
                <SignaturePadComponent />
              </div>
            );

          default:
            return null;
        }
      })}
    </>
  );
}
