# Report Orientation and Thermal Table Debugging Guide

## Where the Decisions Are Made

### 1. **Landscape Orientation Decision**
**Location:**
- **Primary:** `TS1ReportDocument.js` Lines 519-538 (detection)
- **Usage:** `MainReportDocument.jsx` Lines 104-116 (application)

The code detects Vibration tests in `prepareReportData()` and automatically applies landscape orientation:

```javascript
// In TS1ReportDocument.js - Detection
const currentTestCategory = currentTest.testCategory || "";
const isVibrationTest = currentTestCategory.toLowerCase().includes("vibration");
// This flag is included in the returned data

// In MainReportDocument.jsx - Usage
const isVibrationTest = comprehensiveData.isVibrationTest || false;
const useGraphLandscape = isVibrationTest;  // Automatic, no manual override
```

### 2. **Thermal Table Inclusion Decision**
**Location:**
- **Primary:** `TS1ReportDocument.js` Lines 519-538 (detection)
- **Usage:** `TestGraphImages.jsx` Lines 76-92 (application)

The code detects thermal tests in `prepareReportData()` and includes the table automatically:

```javascript
// In TS1ReportDocument.js - Detection
const currentTestCategory = currentTest.testCategory || "";
const isThermalTest = lowerCategory.includes("thermal shock") ||
                      lowerCategory.includes("thermal cycling") ||
                      lowerCategory.includes("humidity") ||
                      // ... etc
// This flag is included in the returned data

// In TestGraphImages.jsx - Usage
const includeThermalTable = comprehensiveData.isThermalTest || false;
if (includeThermalTable) {
  content.push(...createTestGraphTable(comprehensiveData));
}
```

## Data Flow (Simplified - Single Source of Truth)

1. **JCPreview.js** → Prepares data using `prepareReportData(comprehensiveReportData)`
2. **TS1ReportDocument.js** → `prepareReportData()` formats data AND detects test category
   - ✅ Detects if test is Vibration → sets `isVibrationTest: true/false`
   - ✅ Detects if test is Thermal → sets `isThermalTest: true/false`
   - Returns data with these flags included
3. **MainReportDocument.jsx** → `GenerateReportDocument()` receives formatted data
   - ✅ Reads `comprehensiveData.isVibrationTest` flag
   - ✅ Applies landscape orientation if true
4. **TestGraphImages.jsx** → `addTestGraphImages()` receives formatted data
   - ✅ Reads `comprehensiveData.isThermalTest` flag
   - ✅ Includes thermal table if true

**Key Benefit:** Detection happens once in `prepareReportData()`, all other components just use the flags!

## Debug Steps

Console logs have been added at key decision points. Follow these steps:

### Step 1: Generate a Vibration Test Report

1. Open browser Developer Tools (F12) → Console tab
2. Generate a report for a **Vibration test**
3. Look for these console messages:

```
📋 prepareReportData - Test Category Analysis:
  - currentTestCategory: "Vibration"
  - isVibrationTest: true  ← Should be true
  - isThermalTest: false

📄 MainReportDocument - Orientation Decision:
  - isVibrationTest: true  ← Should be true
  - isThermalTest: false
  - finalDecision: "LANDSCAPE"  ← Should be LANDSCAPE
```

### Step 2: Generate a Thermal Test Report

1. Generate a report for a **Thermal Shock** or **Thermal Cycling** test
2. Look for these console messages:

```
📋 prepareReportData - Test Category Analysis:
  - currentTestCategory: "Thermal Shock" (or "Thermal Cycling")
  - isVibrationTest: false
  - isThermalTest: true  ← Should be true

📊 TestGraphImages - Thermal Table Decision:
  - isThermalTest: true  ← Should be true
  - willAddTable: true

✅ Adding thermal test table before graph images  ← Should appear
```

## What to Share (If Issues Occur)

If the features don't work as expected, please share:

1. **The console output** (📋, 📄, 📊 messages) from generating reports
2. **What testCategory value** appears in the first log
3. **Whether the flags are correct** (isVibrationTest, isThermalTest values)

## Common Issues to Check

- **testCategory field not found:** Check if it's named differently in `currentTestRow`
- **Flags are false:** The testCategory string might not match the expected values
- **Table not appearing:** Check if `currentTestEutRows` has data
- **Orientation not working:** Check if graph images are being included

The console logs will pinpoint exactly where the issue occurs!
