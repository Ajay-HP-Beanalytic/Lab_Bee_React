import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Paper,
  FormControlLabel,
  Checkbox,
  Divider,
  Alert,
} from "@mui/material";
import { useState } from "react";
import { toast } from "react-toastify";
import FileBrowser from "../FilesStorage/FileBrowser";
import StorageManager from "../FilesStorage/StorageManager";

const TestHoursCalculator = () => {
  const [testType, setTestType] = useState("");
  const [startTemp, setStartTemp] = useState(25);
  const [targetTemp, setTargetTemp] = useState("");
  const [testStartFrom, setTestStartFrom] = useState("");
  const [targetLowTemp, setTargetLowTemp] = useState("");
  const [targetHighTemp, setTargetHighTemp] = useState("");
  const [transitionTime, setTransitionTime] = useState("");
  // Fixed typo: setTimeToAtainPositiveTemp → setTimeToAttainPositiveTemp
  const [timeToAttainPositiveTemp, setTimeToAttainPositiveTemp] = useState("");
  const [timeToAttainNegativeTemp, setTimeToAttainNegativeTemp] = useState("");
  const [useSeparateRampRates, setUseSeparateRampRates] = useState(false);
  const [rampRate, setRampRate] = useState("");
  const [rampUpRate, setRampUpRate] = useState("");
  const [rampDownRate, setRampDownRate] = useState("");
  const [dwellTime, setDwellTime] = useState("");

  //For Vibration
  const [numberOfAxes, setNumberOfAxes] = useState("");
  const [testDurationPerAxis, setTestDurationPerAxis] = useState("");
  const [numberOfUnits, setNumberOfUnits] = useState("");
  const [vibrationUnitType, setVibrationUnitType] = useState("");

  //For results
  const [numberOfCycles, setNumberOfCycles] = useState(1);
  const [oneCycleDuration, setOneCycleDuration] = useState(0);
  const [estimatedHours, setEstimatedHours] = useState(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState(0);

  const testTypeOptions = [
    { value: "High", label: "High Temperature" },
    { value: "Low", label: "Low Temperature" },
    { value: "Cycling", label: "Thermal Cycling" },
    { value: "Shock", label: "Thermal Shock" },
    { value: "Vibration", label: "Vibration" },
  ];

  const testStartFromOptions = [
    { value: "Positive", label: "Positive (Start from High Temp)" },
    { value: "Negative", label: "Negative (Start from Low Temp)" },
  ];

  const numberOfAxesOptions = [
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
  ];

  const unitTypeOptions = [
    { value: "Units", label: "Units" },
    { value: "Batches", label: "Batches" },
  ];

  const isHighOrLowTempTest = testType === "High" || testType === "Low";
  const isCyclingOrShockTest = testType === "Cycling" || testType === "Shock";
  const isShockTest = testType === "Shock";
  const isCyclingTest = testType === "Cycling";
  const isVibrationTest = testType === "Vibration";

  const handleTestTypeChange = (e) => {
    const selectedTestType = e.target.value;
    setTestType(selectedTestType);
    if (selectedTestType === "High" || selectedTestType === "Low") {
      setUseSeparateRampRates(false);
    }
  };

  // Function to calculate the estimated hours
  const handleCalculateHours = (e) => {
    e.preventDefault();

    let result = null;
    let totalMinutes = 0;

    try {
      if (testType === "High" || testType === "Low") {
        result = calculateHighAndLowTempHours({
          startTemp,
          targetTemp,
          rampRate: Number(rampRate), // Ensure number conversion
          dwellTime: Number(dwellTime),
        });
      } else if (testType === "Cycling") {
        result = calculateThermalCyclingHours({
          startTemp,
          targetHighTemp: Number(targetHighTemp),
          targetLowTemp: Number(targetLowTemp),
          rampRate: Number(rampRate),
          dwellTime: Number(dwellTime),
          testStartFrom,
        });
      } else if (testType === "Shock") {
        result = calculateThermalShockHours({
          startTemp,
          targetHighTemp: Number(targetHighTemp),
          targetLowTemp: Number(targetLowTemp),
          transitionTimeSeconds: Number(transitionTime),
          timeToAttainPositiveTemp: Number(timeToAttainPositiveTemp) || 0,
          timeToAttainNegativeTemp: Number(timeToAttainNegativeTemp) || 0,
          dwellTime: Number(dwellTime),
          testStartFrom,
        });
      } else if (testType === "Vibration") {
        result = calculateVibrationHours({
          numberOfAxes: Number(numberOfAxes),
          testDurationPerAxis: Number(testDurationPerAxis),
          numberOfUnits: Number(numberOfUnits),
          unitType: vibrationUnitType,
        });
      }

      if (result) {
        const oneCycleDuration = Number(result.totalMinutes);
        totalMinutes = oneCycleDuration * numberOfCycles;

        setOneCycleDuration(oneCycleDuration);
        setEstimatedMinutes(totalMinutes);
        setEstimatedHours(totalMinutes / 60);
      }
    } catch (error) {
      console.error("Error calculating hours:", error);
      alert("Please check your input values and try again.");
    }
  };

  // Function to clear the calculation
  const handleClearCalculation = () => {
    setRampRate("");
    setRampUpRate("");
    setRampDownRate("");
    setTransitionTime("");
    setTimeToAttainPositiveTemp("");
    setTimeToAttainNegativeTemp("");
    setDwellTime("");
    setStartTemp(25);
    setTargetTemp("");
    setTargetHighTemp("");
    setTargetLowTemp("");
    setTestStartFrom("");
    setUseSeparateRampRates(false);
    setNumberOfCycles(1);
    setOneCycleDuration(0);
    setEstimatedHours(0);
    setEstimatedMinutes(0);
    // setTestType("");
    // Clear vibration fields
    setNumberOfAxes("");
    setTestDurationPerAxis("");
    setNumberOfUnits("");
    setVibrationUnitType("");
  };

  return (
    <>
      <Paper elevation={3} sx={{ p: 4, maxWidth: 800, margin: "auto", mt: 4 }}>
        <Typography variant="h5" align="center" gutterBottom mb={3}>
          Environmental Test Duration Calculator
        </Typography>

        <form onSubmit={handleCalculateHours}>
          <Grid container spacing={2}>
            {/* Test Type Selection */}
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Select Test Type</InputLabel>
                <Select
                  value={testType}
                  label="Select Test Type"
                  onChange={handleTestTypeChange}
                >
                  {testTypeOptions.map((item) => (
                    <MenuItem key={item.value} value={item.value}>
                      {item.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Information Alert */}
            {(isCyclingOrShockTest || isVibrationTest) && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    <strong>
                      {isShockTest
                        ? "Thermal Shock"
                        : isCyclingTest
                        ? "Thermal Cycling"
                        : "Vibration Test"}
                      :
                    </strong>{" "}
                    {isShockTest
                      ? "Uses fixed transition times between temperatures (rapid temperature changes)"
                      : isCyclingTest
                      ? "Uses ramp rates for gradual temperature changes"
                      : "Test duration calculated per axis and per unit"}
                  </Typography>
                </Alert>
              </Grid>
            )}

            {/* Start Temperature */}
            {!isVibrationTest && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Start Temperature (°C)"
                  variant="outlined"
                  type="number"
                  value={startTemp}
                  onChange={(e) => setStartTemp(Number(e.target.value))}
                  helperText="Usually ambient temperature (25°C)"
                />
              </Grid>
            )}

            {/* Target Temperature for High/Low Tests */}
            {isHighOrLowTempTest && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  required
                  label="Target Temperature (°C)"
                  variant="outlined"
                  type="number"
                  value={targetTemp}
                  onChange={(e) => setTargetTemp(Number(e.target.value))}
                />
              </Grid>
            )}

            {/* Separate Ramp Rates Checkbox */}
            {!isVibrationTest && (
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={useSeparateRampRates}
                      onChange={(e) =>
                        setUseSeparateRampRates(e.target.checked)
                      }
                    />
                  }
                  label="Use different Ramp Up and Ramp Down rates"
                  disabled={isHighOrLowTempTest || isShockTest}
                />
              </Grid>
            )}

            {/* Cycling/Shock Specific Fields */}
            {isCyclingOrShockTest && (
              <>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Test Start Direction</InputLabel>
                    <Select
                      value={testStartFrom}
                      label="Test Start Direction"
                      onChange={(e) => setTestStartFrom(e.target.value)}
                    >
                      {testStartFromOptions.map((item) => (
                        <MenuItem key={item.value} value={item.value}>
                          {item.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Target High Temperature (°C)"
                    variant="outlined"
                    type="number"
                    value={targetHighTemp}
                    onChange={(e) => setTargetHighTemp(Number(e.target.value))}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Target Low Temperature (°C)"
                    variant="outlined"
                    type="number"
                    value={targetLowTemp}
                    onChange={(e) => setTargetLowTemp(Number(e.target.value))}
                  />
                </Grid>
              </>
            )}

            {/* Ramp Rate Fields - Fixed Logic */}
            {!isVibrationTest && (
              <>
                {useSeparateRampRates ? (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        required
                        label="Ramp Up Rate (°C/min)"
                        variant="outlined"
                        type="number"
                        value={rampUpRate}
                        onChange={(e) => setRampUpRate(Number(e.target.value))}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        required
                        label="Ramp Down Rate (°C/min)"
                        variant="outlined"
                        type="number"
                        value={rampDownRate}
                        onChange={(e) =>
                          setRampDownRate(Number(e.target.value))
                        }
                      />
                    </Grid>
                  </>
                ) : (
                  <>
                    {/* Ramp Rate for Non-Shock Tests */}
                    {!isShockTest && (
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          required
                          label="Ramp Rate (°C/min)"
                          variant="outlined"
                          type="number"
                          value={rampRate}
                          onChange={(e) => setRampRate(Number(e.target.value))}
                          helperText="Rate of temperature change per minute"
                        />
                      </Grid>
                    )}

                    {/* Transition Time for Shock Tests */}
                    {isShockTest && (
                      <>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            required
                            label="Transition Time (Seconds)"
                            variant="outlined"
                            type="number"
                            value={transitionTime}
                            onChange={(e) =>
                              setTransitionTime(Number(e.target.value))
                            }
                            helperText="Base transition time between temperatures in seconds"
                          />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Time to Attain High Temp (min)"
                            variant="outlined"
                            type="number"
                            value={timeToAttainPositiveTemp}
                            onChange={(e) =>
                              setTimeToAttainPositiveTemp(
                                Number(e.target.value)
                              )
                            }
                            helperText="Additional time to reach high temperature"
                          />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Time to Attain Low Temp (min)"
                            variant="outlined"
                            type="number"
                            value={timeToAttainNegativeTemp}
                            onChange={(e) =>
                              setTimeToAttainNegativeTemp(
                                Number(e.target.value)
                              )
                            }
                            helperText="Additional time to reach low temperature"
                          />
                        </Grid>
                      </>
                    )}
                  </>
                )}
              </>
            )}

            {/* Dwell Time */}
            {!isVibrationTest && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Dwell Time per Temperature (min)"
                  variant="outlined"
                  type="number"
                  value={dwellTime}
                  onChange={(e) => setDwellTime(Number(e.target.value))}
                  helperText={
                    isCyclingOrShockTest
                      ? "Time spent at each target temperature"
                      : "Time spent at target temperature"
                  }
                />
              </Grid>
            )}

            {/* Vibration Test Fields */}
            {isVibrationTest && (
              <>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth required>
                    <InputLabel>Number of Axes</InputLabel>
                    <Select
                      value={numberOfAxes}
                      label="Number of Axes"
                      onChange={(e) => setNumberOfAxes(e.target.value)}
                    >
                      {numberOfAxesOptions.map((item) => (
                        <MenuItem key={item.value} value={item.value}>
                          {item.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    required
                    label="Test Duration Per Axis (min)"
                    variant="outlined"
                    type="number"
                    value={testDurationPerAxis}
                    // onChange={(e) =>
                    //   setTestDurationPerAxis(Number(e.target.value))
                    // }
                    onChange={(e) => {
                      const val = e.target.value;
                      setTestDurationPerAxis(val === "" ? "" : Number(val));
                    }}
                    helperText="Duration for each axis"
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    required
                    label="Number of Units/Batches"
                    variant="outlined"
                    type="number"
                    value={numberOfUnits}
                    onChange={(e) => setNumberOfUnits(Number(e.target.value))}
                    helperText={
                      vibrationUnitType === "Batches"
                        ? "Number of batches to test"
                        : "Number of individual units to test"
                    }
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth required>
                    <InputLabel>Select Unit Type</InputLabel>
                    <Select
                      value={vibrationUnitType}
                      label="Select Unit Type"
                      onChange={(e) => setVibrationUnitType(e.target.value)}
                    >
                      {unitTypeOptions.map((item) => (
                        <MenuItem key={item.value} value={item.value}>
                          {item.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}

            {/* Calculate Button */}
            <Grid
              item
              xs={12}
              sx={{ display: "flex", justifyContent: "center", gap: 2 }}
            >
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
              >
                {isVibrationTest
                  ? "Calculate Test Duration"
                  : "Calculate Cycle Duration"}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleClearCalculation}
                size="large"
              >
                Clear All
              </Button>
            </Grid>
          </Grid>

          {/* Per Cycle Result */}
          {oneCycleDuration > 0 && (
            <Box mt={3} mb={2} textAlign="center">
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="h6">
                  {isVibrationTest
                    ? "Total Test Duration"
                    : "Duration Per Cycle"}
                  :<strong> {oneCycleDuration.toFixed(2)} minutes</strong>
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {isShockTest
                    ? `Each cycle includes ${(transitionTime / 60).toFixed(
                        1
                      )} min base transitions plus attainment times and ${dwellTime} min dwells`
                    : isCyclingTest
                    ? `Each cycle includes temperature ramping at ${rampRate}°C/min and ${dwellTime} min dwells`
                    : isVibrationTest
                    ? `Includes testing ${numberOfAxes} axes for ${testDurationPerAxis} min each on ${numberOfUnits} units, plus 60 min buffer`
                    : `Includes ramp up, ${dwellTime} min dwell, and ramp down`}
                </Typography>
              </Alert>
            </Box>
          )}

          {!isVibrationTest && (
            <>
              <Divider sx={{ my: 3 }} />

              {/* Total Duration Calculation */}
              <Box textAlign="center">
                <Typography variant="h6" gutterBottom>
                  Calculate Total Test Duration
                </Typography>

                <Grid
                  container
                  spacing={2}
                  justifyContent="center"
                  alignItems="center"
                >
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Number of Cycles"
                      variant="outlined"
                      type="number"
                      value={numberOfCycles}
                      onChange={(e) =>
                        setNumberOfCycles(Number(e.target.value))
                      }
                      inputProps={{ min: 1 }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      size="large"
                      fullWidth
                    >
                      Calculate Total Duration
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </>
          )}

          {/* Total Results */}
          {estimatedMinutes > 0 && (
            <Box mt={3}>
              <Grid container spacing={2} justifyContent="center">
                <Grid item xs={12} sm={4}>
                  <Paper elevation={2} sx={{ p: 2, bgcolor: "primary.50" }}>
                    <Typography variant="h6" color="primary">
                      Total Minutes
                    </Typography>
                    <Typography variant="h4" color="primary.main">
                      {estimatedMinutes.toFixed(0)}
                    </Typography>
                    {isVibrationTest && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Testing {numberOfUnits}{" "}
                        {vibrationUnitType.toLowerCase()} across {numberOfAxes}{" "}
                        axes ({testDurationPerAxis} min per axis) + 60 min
                        buffer
                      </Typography>
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Paper elevation={2} sx={{ p: 2, bgcolor: "success.50" }}>
                    <Typography variant="h6" color="success.main">
                      Total Hours
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {estimatedHours.toFixed(2)}
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Paper elevation={2} sx={{ p: 2, bgcolor: "info.50" }}>
                    <Typography variant="h6" color="info.main">
                      Total Days
                    </Typography>
                    <Typography variant="h4" color="info.main">
                      {(estimatedHours / 24).toFixed(1)}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </form>
      </Paper>

      <br />
      <FileBrowser />

      <br />

      <StorageManager />
    </>
  );
};

// Calculation Functions (unchanged but improved formatting)

// 1. High and Low Temperature Test Calculation
const calculateHighAndLowTempHours = ({
  startTemp,
  targetTemp,
  rampRate,
  dwellTime,
}) => {
  if (targetTemp === startTemp) {
    toast.error(
      "Target temperature cannot be the same as the starting temperature."
    );
    return;
  }
  const deltaT = Math.abs(targetTemp - startTemp);
  const rampUpTime = deltaT / rampRate;
  const dwellAtTarget = dwellTime;
  const rampDownTime = deltaT / rampRate;
  const totalMinutes = rampUpTime + dwellAtTarget + rampDownTime;

  // console.log(`High/Low Temp Calculation:
  //   • Ramp Up (${startTemp}°C to ${targetTemp}°C): ${rampUpTime.toFixed(2)} min
  //   • Dwell at ${targetTemp}°C: ${dwellAtTarget} min
  //   • Ramp Down (${targetTemp}°C to ${startTemp}°C): ${rampDownTime.toFixed(
  //   2
  // )} min
  //   • Total: ${totalMinutes.toFixed(2)} min`);

  return {
    totalHours: (totalMinutes / 60).toFixed(2),
    totalMinutes: totalMinutes.toFixed(2),
  };
};

// 2. Thermal Cycling Test Calculation
const calculateThermalCyclingHours = ({
  startTemp = 25,
  targetHighTemp,
  targetLowTemp,
  rampRate,
  dwellTime,
  testStartFrom = "Positive",
}) => {
  const ambientTemp = startTemp;

  if (testStartFrom === "Positive") {
    const ambientToHighTime = Math.abs(targetHighTemp - ambientTemp) / rampRate;
    const dwellAtHigh = dwellTime;
    const highToLowTime = Math.abs(targetHighTemp - targetLowTemp) / rampRate;
    const dwellAtLow = dwellTime;
    const lowToAmbientTime = Math.abs(targetLowTemp - ambientTemp) / rampRate;

    const totalMinutes =
      ambientToHighTime +
      dwellAtHigh +
      highToLowTime +
      dwellAtLow +
      lowToAmbientTime;

    return {
      totalHours: (totalMinutes / 60).toFixed(2),
      totalMinutes: totalMinutes.toFixed(2),
    };
  } else if (testStartFrom === "Negative") {
    const ambientToLowTime = Math.abs(ambientTemp - targetLowTemp) / rampRate;
    const dwellAtLow = dwellTime;
    const lowToHighTime = Math.abs(targetLowTemp - targetHighTemp) / rampRate;
    const dwellAtHigh = dwellTime;
    const highToAmbientTime = Math.abs(targetHighTemp - ambientTemp) / rampRate;

    const totalMinutes =
      ambientToLowTime +
      dwellAtLow +
      lowToHighTime +
      dwellAtHigh +
      highToAmbientTime;

    return {
      totalHours: (totalMinutes / 60).toFixed(2),
      totalMinutes: totalMinutes.toFixed(2),
    };
  }
};

// 3. Thermal Shock Test Calculation
const calculateThermalShockHours = ({
  startTemp = 25,
  targetHighTemp,
  targetLowTemp,
  transitionTimeSeconds,
  timeToAttainPositiveTemp,
  timeToAttainNegativeTemp,
  dwellTime,
  testStartFrom = "Positive",
}) => {
  //Convert seconds to minutes
  const transitionTimeMinutes = transitionTimeSeconds / 60;

  if (testStartFrom === "Positive") {
    const ambientToHighTime =
      transitionTimeMinutes + (timeToAttainPositiveTemp || 0);
    const dwellAtHigh = dwellTime;
    const highToLowTime =
      transitionTimeMinutes + (timeToAttainNegativeTemp || 0);
    const dwellAtLow = dwellTime;

    const totalMinutes =
      ambientToHighTime + dwellAtHigh + highToLowTime + dwellAtLow;

    // console.log(`Thermal Shock (Positive Start):
    //   • Ambient to High: ${ambientToHighTime.toFixed(2)} min
    //   • Dwell at High: ${dwellAtHigh} min
    //   • High to Low: ${highToLowTime.toFixed(2)} min
    //   • Dwell at Low: ${dwellAtLow} min
    //   • Total: ${totalMinutes.toFixed(2)} min`);

    return {
      totalHours: (totalMinutes / 60).toFixed(2),
      totalMinutes: totalMinutes.toFixed(2),
    };
  } else if (testStartFrom === "Negative") {
    const ambientToLowTime =
      transitionTimeMinutes + (timeToAttainNegativeTemp || 0);
    const dwellAtLow = dwellTime;
    const lowToHighTime =
      transitionTimeMinutes + (timeToAttainPositiveTemp || 0);
    const dwellAtHigh = dwellTime;

    const totalMinutes =
      ambientToLowTime + dwellAtLow + lowToHighTime + dwellAtHigh;

    return {
      totalHours: (totalMinutes / 60).toFixed(2),
      totalMinutes: totalMinutes.toFixed(2),
    };
  }
};

// 4. Vibration Test Calculation - FIXED
const calculateVibrationHours = ({
  numberOfAxes,
  testDurationPerAxis,
  numberOfUnits,
  unitType,
}) => {
  const bufferDuration = 60; // 60 minutes buffer

  if (!numberOfAxes || !testDurationPerAxis || !numberOfUnits || !unitType) {
    toast.error("Please enter all the fields..!");
    return;
  }
  // Fixed calculation: (axes × duration per axis × units) + buffer
  const totalTestTime = numberOfAxes * testDurationPerAxis * numberOfUnits;
  const totalMinutes = totalTestTime + bufferDuration;

  // console.log(`Vibration Test Calculation:
  //   • Number of axes: ${numberOfAxes}
  //   • Test duration per axis: ${testDurationPerAxis} min
  //   • Number of units: ${numberOfUnits}
  //   • Total test time: ${totalTestTime} min
  //   • Buffer time: ${bufferDuration} min
  //   • Total: ${totalMinutes} min`);

  return {
    totalHours: (totalMinutes / 60).toFixed(2),
    totalMinutes: totalMinutes.toFixed(2),
  };
};

export default TestHoursCalculator;
