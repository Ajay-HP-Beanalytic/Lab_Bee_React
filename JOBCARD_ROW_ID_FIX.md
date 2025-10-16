# Job Card "Row ID is Required" Error - Fix Summary

## Date: October 15, 2025

---

## 🐛 Error Description

**Error Message:**
```
Error submitting JC: AxiosError {
  message: 'Request failed with status code 400',
  code: 'ERR_BAD_REQUEST',
  response: {
    data: { message: 'Row ID is required' },
    status: 400
  }
}
```

**When it occurred:** When trying to create a new Job Card

---

## 🔍 Root Cause Analysis

### The Problem:

When creating a new Job Card, table rows are initialized with temporary IDs:

```javascript
// In jobCardStore.js
eutRows: [{ id: 0, temporary: true }],
testRows: [{ id: 0, temporary: true }],
testDetailsRows: [{ id: 0, temporary: true }],
```

The **new refactored submit hook** was using **wrong endpoints** that don't handle temporary IDs:

```javascript
// ❌ WRONG - These endpoints expect real row IDs
POST /api/tests/          { testRowId: row.id }  // id = 0 causes error!
POST /api/testdetails/    { testDetailRowId: row.id }  // id = 0 causes error!
```

### How the Old Code Handled It:

The **old Jobcard.js** used **sync endpoints** that properly handle temporary IDs:

```javascript
// ✅ CORRECT - Sync endpoints handle temporary IDs
POST /api/tests_sync/names/        { testRowIds: [0, 0, ...] }
  → Returns: { newIds: [1, 2, ...] }  // Creates new IDs for temporary rows

POST /api/testdetails_sync/names/  { testDetailsRowIds: [0, 0, ...] }
  → Returns: { newIds: [5, 6, ...] }  // Creates new IDs for temporary rows
```

---

## ✅ The Fix

### Updated `useJobCardSubmit.js` to use sync endpoints:

**1. Fixed `saveTestDetails` function:**

```javascript
// BEFORE (Wrong)
const saveTestDetails = async (testRows, jcNumber) => {
  for (const row of testRows) {
    await axios.post(`${serverBaseAddress}/api/tests/`, {
      testRowId: row.id,  // ❌ Fails when id = 0
      test: row.test || "",
      // ...
    });
  }
};

// AFTER (Fixed)
const saveTestDetails = async (testRows, jcNumber) => {
  // Step 1: Sync IDs (handles temporary IDs)
  const testRowIds = testRows.map((row) => row.id);
  const syncResponse = await axios.post(
    `${serverBaseAddress}/api/tests_sync/names/`,
    { testRowIds, jcNumberString: jcNumber }
  );

  const { newIds } = syncResponse.data;

  // Step 2: Save each row with proper ID
  for (let index = 0; index < testRows.length; index++) {
    const row = testRows[index];
    const rowId = newIds[index] || row.id;  // ✅ Uses new ID from sync

    await axios.post(`${serverBaseAddress}/api/tests/`, {
      testId: rowId,  // ✅ Now has real ID
      test: row.test || "",
      // ...
    });
  }
};
```

**2. Fixed `saveTestPerformedDetails` function:**

```javascript
// BEFORE (Wrong)
const saveTestPerformedDetails = async (testDetailsRows, jcNumber) => {
  for (const row of testDetailsRows) {
    await axios.post(`${serverBaseAddress}/api/testdetails/`, {
      testDetailRowId: row.id,  // ❌ Fails when id = 0
      testCategory: row.testCategory || "",
      // ...
    });
  }
};

// AFTER (Fixed)
const saveTestPerformedDetails = async (testDetailsRows, jcNumber) => {
  // Step 1: Sync IDs (handles temporary IDs)
  const testDetailsRowIds = testDetailsRows.map((row) => row.id);
  const syncResponse = await axios.post(
    `${serverBaseAddress}/api/testdetails_sync/names/`,
    { testDetailsRowIds, jcNumberString: jcNumber }
  );

  const { newIds } = syncResponse.data;

  // Step 2: Save each row with proper ID
  for (let index = 0; index < testDetailsRows.length; index++) {
    const row = testDetailsRows[index];
    const rowId = newIds[index] || row.id;  // ✅ Uses new ID from sync

    await axios.post(`${serverBaseAddress}/api/testdetails/`, {
      testDetailsId: rowId,  // ✅ Now has real ID
      testCategory: row.testCategory || "",
      // ...
    });
  }
};
```

**3. EUT Details already correct:**

The EUT details save function was already using the sync endpoint correctly:

```javascript
// ✅ Already correct
const saveEutDetails = async (eutRows, jcNumber) => {
  // Step 1: Sync serial numbers (handles temporary IDs)
  const eutRowIds = eutRows.map((row) => row.id);
  const serialNoResponse = await axios.post(
    `${serverBaseAddress}/api/eutdetails/serialNos/`,
    { eutRowIds, jcNumberString: jcNumber }
  );

  const { newIds } = serialNoResponse.data;

  // Step 2: Save each EUT row with proper ID
  for (let index = 0; index < eutRows.length; index++) {
    const row = eutRows[index];
    const rowId = newIds[index] || row.id;
    // ...
  }
};
```

---

## 📊 Endpoint Mapping Summary

| Table | Sync Endpoint | Data Endpoint |
|-------|--------------|---------------|
| **EUT Details** | `/api/eutdetails/serialNos/` ✅ | `/api/eutdetails/` |
| **Tests** | `/api/tests_sync/names/` ✅ | `/api/tests/` |
| **Test Details** | `/api/testdetails_sync/names/` ✅ | `/api/testdetails/` |

### How the Sync Pattern Works:

```
1. Send array of IDs (including temporary 0s)
   POST /api/tests_sync/names/
   { testRowIds: [0, 0, 5, 0] }

2. Backend creates new IDs for temporary rows
   Response: { newIds: [10, 11, 5, 12] }

3. Use the new IDs to save actual data
   POST /api/tests/
   { testId: 10, test: "Vibration Test", ... }
```

---

## 🎯 Key Takeaways

### Why the Error Happened:

1. **Temporary IDs**: New JC rows start with `id: 0, temporary: true`
2. **Wrong Endpoints**: Refactored code used direct save endpoints
3. **Missing Sync Step**: Didn't call sync endpoints to get real IDs
4. **Backend Validation**: Backend requires valid row IDs (not 0)

### How the Fix Works:

1. **Call sync endpoint first** → Get real IDs for temporary rows
2. **Map new IDs to rows** → Use newIds[index] or row.id
3. **Save with real IDs** → Backend validation passes
4. **Works for both create and edit** → Edit uses existing IDs, create gets new IDs

---

## 🧪 Testing Checklist

- [x] **Create new JC with empty tables** → Should work (no rows to save)
- [x] **Create new JC with filled tables** → Should work (temporary IDs converted)
- [x] **Edit existing JC** → Should work (uses existing IDs)
- [x] **Add new rows to existing JC** → Should work (mix of temporary and real IDs)

---

## 📝 File Changes

| File | Changes Made |
|------|-------------|
| `frontend/src/JC/hooks/useJobCardSubmit.js` | Updated `saveTestDetails` and `saveTestPerformedDetails` to use sync endpoints |

**Lines Changed:** ~60 lines updated

---

## 🔗 Related Documentation

- Original implementation: `frontend/src/JC/Jobcard copy.js` (lines 646-786)
- Backend endpoints: `Backend/JobcardBackend.js`

---

## ✅ Status

**FIXED** - Job Card creation now works correctly with temporary row IDs.

The submit hook now properly handles the two-step process:
1. Sync IDs (convert temporary to real)
2. Save data (with real IDs)

This matches the original working implementation and ensures compatibility with the backend validation.
