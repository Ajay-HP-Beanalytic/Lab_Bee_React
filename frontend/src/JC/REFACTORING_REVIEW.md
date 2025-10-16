# Jobcard.js Refactoring Review

## 🎯 Current Progress

You've made great progress! You've:
- ✅ Added imports for new components
- ✅ Started using RenderFormFields
- ✅ Started using field configurations
- ⚠️ But there are some critical issues to fix

## 🚨 Critical Issues Found

### Issue #1: **Zustand Store Not Initialized**

**Problem:** You're passing the hook itself instead of calling it

**Current Code (WRONG):**
```javascript
// Line 885, 892, 955, 962
<RenderFormFields
  fields={CUSTOMER_INFO_FIELDS}
  store={useJobCardStore}  // ❌ This is the hook, not the store instance!
/>
```

**Fix:**
```javascript
// At the top of the component (after line 85), add:
const store = useJobCardStore();

// Then use it:
<RenderFormFields
  fields={CUSTOMER_INFO_FIELDS}
  store={store}  // ✅ Now passing the actual store instance
/>
```

### Issue #2: **Duplicate State Variables**

**Problem:** You still have all the old useState declarations (lines 87-114) AND imported the Zustand store

**Current Code (lines 87-114):**
```javascript
const [dcNumber, setDcnumber] = useState("");
const [jcOpenDate, setJcOpenDate] = useState(null);
const [srfDate, setSrfDate] = useState(null);
const [itemReceivedDate, setItemReceivedDate] = useState(null);
const [poNumber, setPonumber] = useState("");
const [jcCategory, setJcCategory] = useState("");
const [testInchargeName, setTestInchargeName] = useState("");
const [jcStatus, setJcStatus] = useState("Open");
const [jcCloseDate, setJcCloseDate] = useState(null);
const [chambersList, setChambersList] = useState([]);
const [observations, setObservations] = useState("");
const [jcLastModifiedBy, setJcLastModifiedBy] = useState(null);
// ... etc
```

**Fix:** Remove ALL these useState declarations and use the store instead:
```javascript
// REMOVE lines 87-114

// REPLACE with just:
const store = useJobCardStore();

// Then access values like:
// store.dcNumber, store.jcOpenDate, store.srfDate, etc.
// And update like:
// store.setDcNumber("value"), store.setJcOpenDate(date), etc.
```

### Issue #3: **Duplicate Constant Declarations**

**Problem:** You have duplicate constants (lines 116-183) that are already defined in `jobCardConstants.js`

**Current Code:**
```javascript
// Lines 116-183
const testCategoryOptions = [
  { value: "Environmental", label: "Environmental" },
  { value: "Screening", label: "Screening" },
  { value: "Other", label: "Other" },
];
// ... more options
```

**Fix:**
```javascript
// REMOVE lines 116-183

// Already imported at line 52-57, just use the configurations directly
// They're already in CUSTOMER_INFO_FIELDS, TEST_CONFIG_FIELDS, etc.
```

### Issue #4: **Not Using Store in useEffect**

**Problem:** useEffect still uses old state setters (lines 206-233)

**Current Code:**
```javascript
useEffect(() => {
  if (id) {
    axios
      .get(`${serverBaseAddress}/api/jobcard/${id}`)
      .then((res) => {
        setJcNumberString(res.data.jobcard.jc_number);  // ❌ Old setter
        setSrfNumber(res.data.jobcard.srf_number);      // ❌ Old setter
        setDcnumber(res.data.jobcard.dcform_number || "");  // ❌ Old setter
        // ... more old setters
      })
      .catch((error) => console.error(error));
  }
}, [id]);
```

**Fix:**
```javascript
useEffect(() => {
  if (id) {
    axios
      .get(`${serverBaseAddress}/api/jobcard/${id}`)
      .then((res) => {
        // Use the store's loadJobCardData method (already built in!)
        store.loadJobCardData(res.data.jobcard);

        // Load table rows if they exist
        if (res.data.eut_details) {
          store.setEutRows(res.data.eut_details);
        }
        if (res.data.tests) {
          store.setTestRows(res.data.tests);
        }
        if (res.data.tests_details) {
          store.setTestDetailsRows(res.data.tests_details);
        }
      })
      .catch((error) => {
        console.error(error);
        toast.error("Failed to load job card");
      });
  }
}, [id]);
```

### Issue #5: **Missing Store Reference in Other useEffects**

**Problem:** Lines 191-202 still use old setters

**Current Code:**
```javascript
useEffect(() => {
  if (loggedInUserDepartment === "TS1 Testing") {
    setJcCategory("TS1");  // ❌ Old setter
  }
}, [loggedInUserDepartment]);

useEffect(() => {
  setTestInchargeName(loggedInUser);  // ❌ Old setter
  setJcLastModifiedBy(loggedInUser);  // ❌ Old setter
}, [loggedInUser]);
```

**Fix:**
```javascript
useEffect(() => {
  if (loggedInUserDepartment === "TS1 Testing") {
    store.setJcCategory("TS1");  // ✅ Use store
  }
}, [loggedInUserDepartment]);

useEffect(() => {
  store.setTestInchargeName(loggedInUser);  // ✅ Use store
  store.setJcLastModifiedBy(loggedInUser);  // ✅ Use store
}, [loggedInUser]);
```

### Issue #6: **JC_CATEGORY_FIELD Should Be Array**

**Problem:** Line 961 passes a single field object, but RenderFormFields expects an array

**Current Code:**
```javascript
<RenderFormFields
  fields={JC_CATEGORY_FIELD}  // ❌ This is an object, not an array
  store={store}
/>
```

**Fix:**
```javascript
<RenderFormFields
  fields={[JC_CATEGORY_FIELD]}  // ✅ Wrap in array
  store={store}
/>
```

### Issue #7: **Missing Store Variables in JSX**

**Problem:** Throughout the JSX, you're still referencing old state variables

**Examples:**
- Line 875-877: `srfNumber`, `newSrfNumberForLastMonth`
- Line 905: `jcNumberString`, `referanceDocs`
- And many more...

**Fix:** Replace all occurrences with store references:
```javascript
// OLD:
{srfNumber}
{jcNumberString}
{referanceDocs}

// NEW:
{store.srfNumber}
{store.jcNumberString}
{store.referanceDocs}
```

## ✅ Step-by-Step Fix Guide

### Step 1: Initialize the Store (Add after line 85)

```javascript
const { loggedInUser, loggedInUserDepartment } = useContext(UserContext);

// ADD THIS LINE:
const store = useJobCardStore();
```

### Step 2: Remove All Duplicate Declarations

**DELETE Lines 87-183:**
- All useState declarations (lines 87-114)
- All option constants (lines 116-183)

### Step 3: Fix All useEffect Hooks

**Replace lines 191-197:**
```javascript
useEffect(() => {
  if (loggedInUserDepartment === "TS1 Testing") {
    store.setJcCategory("TS1");
  }
}, [loggedInUserDepartment, store]);
```

**Replace lines 199-202:**
```javascript
useEffect(() => {
  store.setTestInchargeName(loggedInUser);
  store.setJcLastModifiedBy(loggedInUser);
}, [loggedInUser, store]);
```

**Replace lines 205-233:**
```javascript
useEffect(() => {
  if (id) {
    axios
      .get(`${serverBaseAddress}/api/jobcard/${id}`)
      .then((res) => {
        store.loadJobCardData(res.data.jobcard);
        if (res.data.eut_details) store.setEutRows(res.data.eut_details);
        if (res.data.tests) store.setTestRows(res.data.tests);
        if (res.data.tests_details) store.setTestDetailsRows(res.data.tests_details);
        if (res.data.attachments) store.setReferanceDocs(res.data.attachments);
      })
      .catch((error) => {
        console.error(error);
        toast.error("Failed to load job card");
      });
  }
}, [id, store]);
```

### Step 4: Fix RenderFormFields Calls

**Lines 883-886:**
```javascript
<RenderFormFields
  fields={CUSTOMER_INFO_FIELDS}
  store={store}  // ✅ Changed from useJobCardStore
/>
```

**Lines 890-893:**
```javascript
<RenderFormFields
  fields={TEST_CONFIG_FIELDS}
  store={store}  // ✅ Changed from useJobCardStore
/>
```

**Lines 953-956:**
```javascript
<RenderFormFields
  fields={JC_METADATA_FIELDS}
  store={store}  // ✅ Changed from useJobCardStore
/>
```

**Lines 960-963:**
```javascript
<RenderFormFields
  fields={[JC_CATEGORY_FIELD]}  // ✅ Wrapped in array
  store={store}  // ✅ Changed from useJobCardStore
/>
```

### Step 5: Update All Handler Functions

**Find and replace in ALL handler functions:**

```javascript
// Example: handleSrfDateChange (lines 236-245)
const handleSrfDateChange = (newDate) => {
  try {
    const formattedSrfDate = newDate
      ? dayjs(newDate).format("YYYY-MM-DD")
      : null;
    store.setSrfDate(formattedSrfDate);  // ✅ Use store
  } catch (error) {
    console.error("Error formatting SRF date:", error);
  }
};

// Similarly for ALL other handlers:
// handleJcStartDateChange, handleItemReceivedDateChange, etc.
```

### Step 6: Update JSX Variable References

**Find and replace throughout the JSX:**

```javascript
// Search for these patterns and replace:

// OLD → NEW
srfNumber → store.srfNumber
jcNumberString → store.jcNumberString
referanceDocs → store.referanceDocs
jcOpenDate → store.jcOpenDate
srfDate → store.srfDate
itemReceivedDate → store.itemReceivedDate
jcCloseDate → store.jcCloseDate
dcNumber → store.dcNumber
poNumber → store.poNumber
jcCategory → store.jcCategory
jcStatus → store.jcStatus
observations → store.observations
testInchargeName → store.testInchargeName
chambersList → store.chambersList

// And for all setters:
setDcnumber → store.setDcNumber
setPonumber → store.setPoNumber
setJcOpenDate → store.setJcOpenDate
setSrfDate → store.setSrfDate
// ... etc for all setters
```

## 📝 Quick Reference: Full Component Structure

Here's what the top of your component should look like after fixes:

```javascript
const Jobcard = ({ jobCardData }) => {
  // Zustand stores
  const store = useJobCardStore();
  const testNames = useTestsAndChambersStore((state) => state.testNames);
  const testChambers = useTestsAndChambersStore((state) => state.testChambers);

  // Context
  const { loggedInUser, loggedInUserDepartment } = useContext(UserContext);

  // Router hooks
  const navigate = useNavigate();
  const { id } = useParams();

  // UI helpers
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  // Local state (only things NOT in the store)
  const [users, setUsers] = useState([]);
  const [addNewJcToLastMonth, setAddNewJcToLastMonth] = useState(false);
  // ... any other LOCAL-ONLY state

  // useEffects
  useEffect(() => {
    if (loggedInUserDepartment === "TS1 Testing") {
      store.setJcCategory("TS1");
    }
  }, [loggedInUserDepartment, store]);

  // ... rest of component
```

## 🎯 Testing Checklist

After making these changes, test:

1. ✅ Page loads without errors
2. ✅ Form fields display correctly
3. ✅ Can type in text fields
4. ✅ Dropdowns work
5. ✅ Date pickers work
6. ✅ Tables display
7. ✅ Can add/remove table rows
8. ✅ Can save new job card
9. ✅ Can edit existing job card
10. ✅ All data persists correctly

## 💡 Pro Tips

1. **Find & Replace is your friend:**
   - Use your IDE's find & replace to quickly update all references
   - Search for patterns like `setJcOpenDate` → `store.setJcOpenDate`

2. **Check console for errors:**
   - Look for "undefined" or "not a function" errors
   - These indicate places you missed updating

3. **One section at a time:**
   - Fix the imports and initialization first
   - Then fix useEffects
   - Then fix handlers
   - Finally fix JSX

4. **Keep old code as backup:**
   - Create `Jobcard_OLD.js` backup before making changes
   - You can refer back if needed

## 📊 Progress So Far

| Task | Status |
|------|--------|
| Import new components | ✅ Done |
| Use field configurations | ✅ Done |
| Initialize Zustand store | ❌ Need to fix |
| Remove duplicate state | ❌ Need to fix |
| Update useEffects | ❌ Need to fix |
| Update handlers | ❌ Need to fix |
| Update JSX references | ⚠️ Partially done |

You're about 30% of the way there! The foundation is good, just need to connect everything properly.

Good luck! 🚀
