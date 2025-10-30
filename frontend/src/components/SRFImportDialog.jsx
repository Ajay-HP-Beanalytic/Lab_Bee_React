import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import MappingIcon from "@mui/icons-material/SwapHoriz";
import mammoth from "mammoth";
import {
  CUSTOMER_INFO_FIELDS,
  TEST_CONFIG_FIELDS,
} from "../JC/constants/formFieldConfigurations";

const ADDITIONAL_TARGET_FIELDS = [{ stateKey: "poNumber", label: "PO Number" }];

const TARGET_FIELDS = [
  ...CUSTOMER_INFO_FIELDS,
  ...TEST_CONFIG_FIELDS,
  ...ADDITIONAL_TARGET_FIELDS,
]
  .map((field) => {
    const key = field.stateKey || field.key || field.name;
    if (!key) {
      return null;
    }

    const labelSource = field.label || field.name || key;
    const label =
      typeof labelSource === "string"
        ? labelSource.replace(/\s+/g, " ").trim()
        : String(labelSource);

    return { key, label };
  })
  .filter((field) => field)
  .filter(
    (field, index, self) =>
      self.findIndex((candidate) => candidate.key === field.key) === index
  );

const FIELD_PATTERNS = {
  companyName: [
    "company name",
    "organisation name",
    "organization name",
    "customer company",
    "firm name",
  ],
  companyAddress: [
    "company address",
    "customer address",
    "office address",
    "address",
  ],
  customerName: [
    "customer name",
    "test requested by",
    "client name",
    "contact person",
  ],
  customerEmail: ["email id", "email address", "customer email", "e mail"],
  customerNumber: [
    "contact number",
    "contact no",
    "phone number",
    "mobile number",
    "telephone",
  ],
  projectName: ["project name", "project title"],
  poNumber: ["po number", "purchase order", "po no"],
  srfDate: [
    "srf date",
    "service request form date",
    "request date",
    "test requested date",
    "form date",
    "document date",
    "date",
  ],
  testWitnessedBy: [
    "test witnessed by",
    "witnessed by",
    "customer witness",
    "witness name",
  ],
  testInstructions: [
    "instructions during test",
    "customer instructions",
    "instructions",
  ],
  testCategory: ["test category", "environmental", "screening", "category"],
  testDiscipline: ["test discipline", "discipline"],
  typeOfRequest: ["type of request", "request type"],
  sampleCondition: ["sample condition", "condition of samples"],
  reportType: ["report type", "nabl", "non nabl", "report status"],
};

const HEADER_KEYWORDS = [
  "sl no",
  "s no",
  "serial number",
  "nomenclature",
  "description",
  "eut",
  "dut",
  "qty",
  "quantity",
  "part no",
  "model no",
  "test name",
  "test standard",
  "test profile",
  "nabl",
  "customer details",
  "eut/dut details",
  "test details",
  "note",
  "reference document details",
];

const normalizeForMatch = (value) =>
  (value || "")
    .toString()
    .toLowerCase()
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const stripTrailingDelimiters = (value) =>
  (value || "").replace(/[:\-–—\s]+$/gu, "").trim();

const isPlaceholderValue = (value) => {
  const trimmed = (value || "").trim();
  if (!trimmed || trimmed === "-") {
    return true;
  }
  return (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  );
};

const extractSegmentsFromCell = (rawCell) =>
  (rawCell || "")
    .replace(/\r/g, " ")
    .split(/\n+/)
    .map((segment) => segment.replace(/\s+/g, " ").trim())
    .filter(Boolean);

const joinSegments = (segments) =>
  segments
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();

const buildExcludedTableIndexSet = (tables, eutIndex, testIndex) => {
  const excluded = new Set();
  if (eutIndex !== null && tables[eutIndex]) {
    excluded.add(tables[eutIndex].index);
  }
  if (testIndex !== null && tables[testIndex]) {
    excluded.add(tables[testIndex].index);
  }
  return excluded;
};

const filterValuesByExcludedTables = (values, excludedTableIndexes) => {
  if (!excludedTableIndexes || excludedTableIndexes.size === 0) {
    return values;
  }
  return values.filter((value) => !excludedTableIndexes.has(value.tableIndex));
};

/**
 * SRFImportDialog - Extract DOCX data and map to Job Card fields
 *
 * Flow:
 * 1. Upload DOCX - extract all tables and data
 * 2. Mapping Interface:
 *    - LEFT: TS1StepOne fields (destination)
 *    - RIGHT: Extracted DOCX data (source)
 *    - User maps source → destination
 * 3. Import mapped data to Job Card
 */
const SRFImportDialog = ({ open, onClose, onImport }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState("");
  const [showMapping, setShowMapping] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Extracted data from DOCX
  const [rawExtractedValues, setRawExtractedValues] = useState([]); // Unfiltered label-value pairs
  const [extractedValues, setExtractedValues] = useState([]); // Filtered label-value pairs
  const [extractedTables, setExtractedTables] = useState([]); // All tables with rows

  // Mapping state
  const [fieldMappings, setFieldMappings] = useState({}); // form field mappings
  const [eutTableMapping, setEutTableMapping] = useState({}); // EUT column mappings
  const [testTableMapping, setTestTableMapping] = useState({}); // Test column mappings
  const [selectedEutTableIndex, setSelectedEutTableIndex] = useState(null);
  const [selectedTestTableIndex, setSelectedTestTableIndex] = useState(null);

  const EUT_COLUMNS = [
    { key: "nomenclature", label: "Nomenclature/EUT Description" },
    { key: "qty", label: "Qty" },
    { key: "partNo", label: "Part No" },
    { key: "modelNo", label: "Model No" },
    { key: "serialNo", label: "Serial No" },
  ];

  const TEST_COLUMNS = [
    { key: "test", label: "Test" },
    { key: "nabl", label: "NABL/Non-NABL" },
    { key: "testStandard", label: "Test Standard" },
    { key: "testProfile", label: "Test Profile" },
  ];

  // Parse DOCX file and extract all data
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".docx")) {
      setError("Please upload a DOCX file");
      return;
    }

    setFileName(file.name);
    setLoading(true);
    setError(null);
    setShowMapping(false);

    try {
      const arrayBuffer = await file.arrayBuffer();

      // Convert DOCX to HTML
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = result.value;

      // Parse tables from HTML
      const tables = parseTablesFromHTML(html);

      // Split complex tables that contain multiple sections
      const splitTables = splitComplexTables(tables);

      // splitTables.forEach((table, idx) => {
      //   console.log(`Table ${idx + 1}:`, {
      //     rows: table.rows.length,
      //     columns: table.rows[0]?.length || 0,
      //     firstRow: table.rows[0],
      //     sampleData: table.rows.slice(0, 3),
      //   });
      // });
      setExtractedTables(splitTables);

      // Extract all label-value pairs (only from form field tables, not EUT/Test)
      const rawValues = extractAllCellValues(splitTables);
      setRawExtractedValues(rawValues);

      // Auto-detect EUT and Test tables from split tables
      const eutTableIdx = detectEUTTable(splitTables);
      const testTableIdx = detectTestTable(splitTables);

      const excludedIndexes = buildExcludedTableIndexSet(
        splitTables,
        eutTableIdx,
        testTableIdx
      );

      const filteredValues = filterValuesByExcludedTables(
        rawValues,
        excludedIndexes
      );
      setExtractedValues(filteredValues);

      if (filteredValues.length === 0 && splitTables.length === 0) {
        setError("No data found in document. Please check the file format.");
      } else {
        // Auto-map fields
        const autoMappings = autoMapFields(filteredValues);
        setFieldMappings(autoMappings);

        setSelectedEutTableIndex(eutTableIdx);
        setSelectedTestTableIndex(testTableIdx);

        // Auto-map table columns if detected
        if (eutTableIdx !== null) {
          const eutMapping = autoMapTableColumns(
            splitTables[eutTableIdx],
            EUT_COLUMNS
          );
          setEutTableMapping(eutMapping);
        }

        if (testTableIdx !== null) {
          const testMapping = autoMapTableColumns(
            splitTables[testTableIdx],
            TEST_COLUMNS
          );
          setTestTableMapping(testMapping);
        }

        setActiveTab(0);
        setShowMapping(true);
      }
    } catch (err) {
      console.error("Error parsing DOCX:", err);
      setError(`Failed to parse document: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Recompute form-field source values when table selections change
  useEffect(() => {
    if (rawExtractedValues.length === 0) {
      return;
    }

    const excludedIndexes = buildExcludedTableIndexSet(
      extractedTables,
      selectedEutTableIndex,
      selectedTestTableIndex
    );

    const filtered = filterValuesByExcludedTables(
      rawExtractedValues,
      excludedIndexes
    );

    setExtractedValues((prev) => {
      if (
        prev.length === filtered.length &&
        prev.every((item, index) => item.id === filtered[index]?.id)
      ) {
        return prev;
      }
      return filtered;
    });

    setFieldMappings((prev) => {
      if (!prev || Object.keys(prev).length === 0) {
        return prev;
      }
      const allowedIds = new Set(filtered.map((value) => value.id));
      let changed = false;
      const next = Object.entries(prev).reduce((acc, [key, valueId]) => {
        if (allowedIds.has(valueId)) {
          acc[key] = valueId;
        } else {
          changed = true;
        }
        return acc;
      }, {});
      return changed ? next : prev;
    });
  }, [
    rawExtractedValues,
    extractedTables,
    selectedEutTableIndex,
    selectedTestTableIndex,
  ]);

  // Parse HTML to extract all tables
  const parseTablesFromHTML = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const tableElements = doc.querySelectorAll("table");

    const tables = [];
    tableElements.forEach((table, tableIndex) => {
      const rows = [];
      const trs = table.querySelectorAll("tr");

      trs.forEach((tr) => {
        const cells = [];
        const tds = tr.querySelectorAll("td, th");

        tds.forEach((td) => {
          const text = td.textContent
            ? td.textContent.replace(/\r/g, " ").trim()
            : "";
          cells.push(text);
        });

        if (cells.length > 0) {
          rows.push(cells);
        }
      });

      if (rows.length > 0) {
        tables.push({ index: tableIndex, rows });
      }
    });

    return tables;
  };

  // Split complex tables that contain multiple sections (form fields + EUT + Test)
  const splitComplexTables = (tables) => {
    const splitTables = [];
    let tableCounter = 0;

    tables.forEach((table) => {
      const sections = identifyTableSections(table);

      if (sections.length === 0) {
        // No sections identified, keep as-is
        splitTables.push({ index: tableCounter++, rows: table.rows });
        return;
      }

      // Create separate tables for each section
      sections.forEach((section) => {
        if (section.rows.length > 0) {
          splitTables.push({
            index: tableCounter++,
            rows: section.rows,
            sectionType: section.type,
          });
        }
      });
    });

    return splitTables;
  };

  // Identify different sections within a complex table
  const identifyTableSections = (table) => {
    const sections = [];
    let currentSection = { type: "form", rows: [] };
    let inEutSection = false;
    let inTestSection = false;

    for (let i = 0; i < table.rows.length; i++) {
      const row = table.rows[i];
      const cellText = row.join(" ").toLowerCase().trim();

      // Check for section headers
      if (cellText.includes("eut") && cellText.includes("details")) {
        // Save current section
        if (currentSection.rows.length > 0) {
          sections.push(currentSection);
        }
        inEutSection = true;
        inTestSection = false;
        currentSection = { type: "eut", rows: [] };
        continue; // Skip the header row itself
      } else if (cellText.includes("test") && cellText.includes("details")) {
        // Save current section
        if (currentSection.rows.length > 0) {
          sections.push(currentSection);
        }
        inTestSection = true;
        inEutSection = false;
        currentSection = { type: "test", rows: [] };
        continue; // Skip the header row itself
      } else if (
        cellText.includes("customer details") ||
        cellText.includes("reference document")
      ) {
        // End of test section, back to form fields
        if (currentSection.rows.length > 0) {
          sections.push(currentSection);
        }
        inEutSection = false;
        inTestSection = false;
        currentSection = { type: "form", rows: [] };
        // Continue processing this row as form field
      }

      // Determine if this row belongs to current section
      const colCount = row.filter((cell) => cell && cell.trim()).length;

      if (inEutSection && colCount >= 5) {
        // EUT rows typically have 6 columns (SL, Nomenclature, Qty, Part, Model, Serial)
        currentSection.rows.push(row);
      } else if (inTestSection && colCount >= 3) {
        // Test rows typically have 4 columns (SL, Test Name, Standard, Profile)
        currentSection.rows.push(row);
      } else if (
        !inEutSection &&
        !inTestSection &&
        colCount <= 2 &&
        colCount > 0
      ) {
        // Form field rows (2 columns: label-value)
        currentSection.rows.push(row);
      }
      // Skip empty or single-column rows
    }

    // Add the last section
    if (currentSection.rows.length > 0) {
      sections.push(currentSection);
    }

    return sections;
  };

  // Extract label-value pairs from tables (2-column format)
  const extractAllCellValues = (tables, excludeTableIndexes = new Set()) => {
    const values = [];
    let idCounter = 0;
    const seenPairs = new Set();

    const pushValue = (labelSegments, valueSegments, table, rowIdx) => {
      if (!labelSegments.length || !valueSegments.length) {
        return;
      }

      const labelText = stripTrailingDelimiters(joinSegments(labelSegments));
      const valueText = joinSegments(valueSegments);

      if (!labelText || !valueText) {
        return;
      }

      if (isTableHeader(labelText) || isPlaceholderValue(valueText)) {
        return;
      }

      const pairKey = `${labelText}::${valueText}`;
      if (seenPairs.has(pairKey)) {
        return;
      }
      seenPairs.add(pairKey);

      values.push({
        id: `val_${idCounter++}`,
        label: labelText,
        value: valueText,
        tableIndex: table.index,
        rowIndex: rowIdx,
      });
    };

    tables.forEach((table) => {
      if (excludeTableIndexes.has(table.index)) {
        return;
      }

      // Skip EUT and Test tables - only extract from form field tables
      if (table.sectionType === "eut" || table.sectionType === "test") {
        return;
      }

      table.rows.forEach((row, rowIdx) => {
        const cellCount = row.length;

        if (cellCount >= 2) {
          for (let i = 0; i < cellCount - 1; i += 2) {
            const labelSegments = extractSegmentsFromCell(row[i]);
            const valueSegments = extractSegmentsFromCell(row[i + 1]);
            pushValue(labelSegments, valueSegments, table, rowIdx);
          }
        } else if (cellCount === 1) {
          const cellSegments = extractSegmentsFromCell(row[0]);

          if (cellSegments.length >= 2) {
            const labelSegments = [cellSegments[0]];
            const valueSegments = cellSegments.slice(1);
            pushValue(labelSegments, valueSegments, table, rowIdx);
          } else if (cellSegments.length === 1) {
            const singleText = cellSegments[0];
            const colonIndex = singleText.indexOf(":");

            if (colonIndex > -1) {
              const labelText = singleText.slice(0, colonIndex);
              const valueText = singleText.slice(colonIndex + 1);

              const labelSegments = extractSegmentsFromCell(labelText);
              const valueSegments = extractSegmentsFromCell(valueText);
              pushValue(labelSegments, valueSegments, table, rowIdx);
            }
          }
        }
      });
    });

    return values;
  };

  // Check if a cell value looks like a table header (to skip it)
  const isTableHeader = (text) => {
    const normalized = normalizeForMatch(text);
    if (!normalized) {
      return true;
    }
    return HEADER_KEYWORDS.some((keyword) => normalized.includes(keyword));
  };

  // Auto-map fields based on label similarity
  const autoMapFields = (values) => {
    const mappings = {};
    const usedValueIds = new Set();

    TARGET_FIELDS.forEach((field) => {
      const normalizedFieldLabel = normalizeForMatch(field.label);
      const patterns = (FIELD_PATTERNS[field.key] || []).map((pattern) =>
        normalizeForMatch(pattern)
      );

      let chosenValue = null;
      let bestScore = 0;

      values.forEach((value) => {
        if (usedValueIds.has(value.id)) {
          return;
        }

        const normalizedLabel = normalizeForMatch(value.label);
        if (!normalizedLabel) {
          return;
        }

        let score = 0;

        if (normalizedLabel === normalizedFieldLabel && normalizedFieldLabel) {
          score += 100;
        }

        if (
          normalizedFieldLabel &&
          (normalizedLabel.includes(normalizedFieldLabel) ||
            normalizedFieldLabel.includes(normalizedLabel))
        ) {
          score += 60;
        }

        patterns.forEach((pattern) => {
          if (pattern && normalizedLabel.includes(pattern)) {
            score += 30 + pattern.length;
          }
        });

        if (score > bestScore) {
          bestScore = score;
          chosenValue = value;
        }
      });

      if (chosenValue && bestScore > 0) {
        mappings[field.key] = chosenValue.id;
        usedValueIds.add(chosenValue.id);
      }
    });

    return mappings;
  };

  // Detect EUT table by checking headers or section type
  const detectEUTTable = (tables) => {
    // First, check if any table has sectionType === 'eut'
    for (let i = 0; i < tables.length; i++) {
      if (tables[i].sectionType === "eut") {
        return i;
      }
    }

    // Fallback: check by keywords
    const eutKeywords = [
      "nomenclature",
      "description",
      "eut description",
      "model no",
      "serial no",
      "qty",
      "quantity",
      "part no",
    ];

    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      if (table.rows.length <= 1) continue;

      const firstRow = table.rows[0].map((cell) => normalizeForMatch(cell));
      const matchCount = firstRow.filter((cell) =>
        eutKeywords.some((kw) => cell.includes(normalizeForMatch(kw)))
      ).length;

      if (matchCount >= 3) {
        return i;
      }
    }
    return null;
  };

  // Detect Test table by checking headers or section type
  const detectTestTable = (tables) => {
    // First, check if any table has sectionType === 'test'
    for (let i = 0; i < tables.length; i++) {
      if (tables[i].sectionType === "test") {
        return i;
      }
    }

    // Fallback: check by keywords
    const testKeywords = [
      "test name",
      "test",
      "test standard",
      "standard",
      "method",
      "nabl",
      "profile",
      "test profile",
    ];

    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      if (table.rows.length <= 1) continue;

      const firstRow = table.rows[0].map((cell) => normalizeForMatch(cell));
      const matchCount = firstRow.filter((cell) =>
        testKeywords.some((kw) => cell.includes(normalizeForMatch(kw)))
      ).length;

      if (matchCount >= 2) {
        return i;
      }
    }
    return null;
  };

  // Auto-map table columns
  const autoMapTableColumns = (table, targetColumns) => {
    const mapping = {};
    if (!table || table.rows.length === 0) return mapping;

    const headerRow = table.rows[0].map((cell) => normalizeForMatch(cell));

    const columnPatterns = {
      nomenclature: [
        "nomenclature",
        "nomenclature/description",
        "eut description",
        "description",
        "item",
      ],
      qty: ["qty", "quantity", "qnty"],
      partNo: ["part no", "part number", "part", "part no."],
      modelNo: ["model no", "model number", "model", "model no."],
      serialNo: ["serial no", "serial number", "s.no", "s/n", "serial no."],
      test: ["test", "test name", "tests"],
      nabl: ["nabl", "nabl/non-nabl", "accreditation"],
      testStandard: [
        "test standard",
        "standard",
        "testing standard",
        "method",
        "test standard/method",
        "test standard / method",
      ],
      testProfile: ["test profile", "profile", "condition", "test conditions"],
    };

    targetColumns.forEach((col) => {
      const patterns = columnPatterns[col.key] || [];

      const matchIndex = headerRow.findIndex((header) =>
        patterns.some((pattern) => header.includes(normalizeForMatch(pattern)))
      );

      if (matchIndex !== -1) {
        mapping[col.key] = matchIndex;
      }
    });

    return mapping;
  };

  // Handle field mapping change
  const handleFieldMappingChange = (fieldKey, valueId) => {
    setFieldMappings((prev) => {
      const updated = { ...prev };

      if (!valueId) {
        delete updated[fieldKey];
      } else {
        updated[fieldKey] = valueId;
      }

      return updated;
    });
  };

  // Handle table column mapping change
  const handleColumnMappingChange = (tableType, columnKey, columnIndex) => {
    if (tableType === "eut") {
      setEutTableMapping((prev) => ({
        ...prev,
        [columnKey]: columnIndex === "" ? undefined : parseInt(columnIndex),
      }));
    } else if (tableType === "test") {
      setTestTableMapping((prev) => ({
        ...prev,
        [columnKey]: columnIndex === "" ? undefined : parseInt(columnIndex),
      }));
    }
  };

  // Get mapped value for a field
  const getMappedValue = (fieldKey) => {
    const valueId = fieldMappings[fieldKey];
    if (!valueId) return null;

    return extractedValues.find((v) => v.id === valueId) || null;
  };

  // Build final data object from mappings
  const buildMappedData = () => {
    const data = {};

    // Map form fields
    TARGET_FIELDS.forEach((field) => {
      const mapped = getMappedValue(field.key);
      if (mapped && mapped.value) {
        data[field.key] = mapped.value;
      }
    });

    // Map EUT table
    if (
      selectedEutTableIndex !== null &&
      Object.keys(eutTableMapping).length > 0
    ) {
      const eutTable = extractedTables[selectedEutTableIndex];
      const eutRows = eutTable.rows.slice(1).map((row, index) => {
        const mappedRow = {
          id: index,
          serialNumber: index + 1,
        };
        EUT_COLUMNS.forEach((col) => {
          const colIndex = eutTableMapping[col.key];
          const rawValue =
            colIndex !== undefined && colIndex < row.length
              ? row[colIndex] || ""
              : "";
          mappedRow[col.key] = rawValue ? rawValue.trim() : "";
        });
        return mappedRow;
      });
      const eutDataKeys = new Set(EUT_COLUMNS.map((col) => col.key));
      data.eutDetails = eutRows.filter((row) =>
        Array.from(eutDataKeys).some((key) => {
          const value = row[key];
          return value !== undefined && String(value).trim() !== "";
        })
      );
    }

    // Map Test table
    if (
      selectedTestTableIndex !== null &&
      Object.keys(testTableMapping).length > 0
    ) {
      const testTable = extractedTables[selectedTestTableIndex];
      const testRows = testTable.rows.slice(1).map((row, index) => {
        const mappedRow = {
          id: index,
          serialNumber: index + 1,
        };
        TEST_COLUMNS.forEach((col) => {
          const colIndex = testTableMapping[col.key];
          const rawValue =
            colIndex !== undefined && colIndex < row.length
              ? row[colIndex] || ""
              : "";
          mappedRow[col.key] = rawValue ? rawValue.trim() : "";
        });
        return mappedRow;
      });
      const testDataKeys = new Set(TEST_COLUMNS.map((col) => col.key));
      data.testDetails = testRows.filter((row) =>
        Array.from(testDataKeys).some((key) => {
          const value = row[key];
          return value !== undefined && String(value).trim() !== "";
        })
      );
    }

    return data;
  };

  // Get user-friendly table description
  const getTableDescription = (table) => {
    if (!table || !table.rows || table.rows.length === 0) {
      return "Empty table";
    }

    const dataRowCount = table.rows.length - 1; // Exclude header row
    const columnCount = table.rows[0]?.length || 0;
    const dataColumnCount = columnCount > 0 ? columnCount - 1 : 0; // Exclude SL. No. column

    if (table.sectionType === "eut") {
      return `EUT/DUT Details (${dataRowCount} rows, ${dataColumnCount} columns)`;
    } else if (table.sectionType === "test") {
      return `Test Details (${dataRowCount} rows, ${dataColumnCount} columns)`;
    } else {
      return `Table with ${table.rows.length} rows, ${columnCount} columns`;
    }
  };

  // Filter tables to show only EUT-compatible tables
  const getEutTableOptions = () => {
    return extractedTables
      .map((table, idx) => ({ table, index: idx }))
      .filter(({ table }) => table.sectionType === "eut");
  };

  // Filter tables to show only Test-compatible tables
  const getTestTableOptions = () => {
    return extractedTables
      .map((table, idx) => ({ table, index: idx }))
      .filter(({ table }) => table.sectionType === "test");
  };

  // Handle import confirmation
  const handleConfirmImport = () => {
    const mappedData = buildMappedData();

    if (onImport) {
      onImport(mappedData);
    }

    handleClose();
  };

  // Close dialog and reset
  const handleClose = () => {
    setLoading(false);
    setError(null);
    setFileName("");
    setShowMapping(false);
    setActiveTab(0);
    setRawExtractedValues([]);
    setExtractedValues([]);
    setExtractedTables([]);
    setFieldMappings({});
    setEutTableMapping({});
    setTestTableMapping({});
    setSelectedEutTableIndex(null);
    setSelectedTestTableIndex(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <MappingIcon />
          <Typography variant="h6">Import SRF Data from DOCX</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {!showMapping ? (
          <Box>
            <Box sx={{ mb: 3, mt: 2 }}>
              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUploadIcon />}
                fullWidth
                size="large"
                disabled={loading}
              >
                {fileName || "Choose DOCX File"}
                <input
                  type="file"
                  hidden
                  accept=".docx"
                  onChange={handleFileUpload}
                />
              </Button>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: "block", textAlign: "center" }}
              >
                Upload your SRF document (.docx format)
              </Typography>
            </Box>

            {loading && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  Extracting data from document...
                </Typography>
              </Box>
            )}

            {error && (
              <Alert severity="error" icon={<ErrorIcon />} sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
          </Box>
        ) : (
          <Box sx={{ mt: 2 }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <strong>Map extracted data to Job Card fields</strong>
              <br />
              File: {fileName}
            </Alert>

            <Tabs
              value={activeTab}
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}
            >
              <Tab label="General Info" />
              <Tab label="EUT Table" />
              <Tab label="Test Table" />
            </Tabs>

            {/* Tab 0: Form Fields Mapping */}
            {activeTab === 0 && (
              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Map document fields to Job Card fields. Match document labels
                  (left in DOCX) with target fields (right in Job Card).
                </Typography>

                <Grid container spacing={2}>
                  {TARGET_FIELDS.map((field) => {
                    const mappedValue = getMappedValue(field.key);
                    const mappedValueId = fieldMappings[field.key] ?? "";

                    return (
                      <Grid item xs={12} key={field.key}>
                        <Card variant="outlined">
                          <CardContent sx={{ p: 2 }}>
                            <Grid container spacing={2} alignItems="center">
                              <Grid item xs={12} md={4}>
                                <Typography
                                  variant="subtitle2"
                                  color="primary"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {field.label}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  Target Field
                                </Typography>
                              </Grid>

                              <Grid item xs={12} md={4}>
                                <FormControl fullWidth size="small">
                                  <InputLabel>Select Document Field</InputLabel>
                                  <Select
                                    value={mappedValueId}
                                    onChange={(e) =>
                                      handleFieldMappingChange(
                                        field.key,
                                        e.target.value
                                      )
                                    }
                                    label="Select Document Field"
                                  >
                                    <MenuItem value="">
                                      <em>None</em>
                                    </MenuItem>
                                    {extractedValues.map((v) => (
                                      <MenuItem key={v.id} value={v.id}>
                                        <Box
                                          sx={{
                                            display: "flex",
                                            flexDirection: "column",
                                          }}
                                        >
                                          <Typography
                                            variant="body2"
                                            sx={{
                                              fontWeight:
                                                mappedValueId === v.id
                                                  ? 600
                                                  : 500,
                                            }}
                                          >
                                            {v.label}
                                          </Typography>
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                          >
                                            {v.value}
                                          </Typography>
                                        </Box>
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ mt: 0.5, display: "block" }}
                                >
                                  Document Field (Label &amp; Value)
                                </Typography>
                              </Grid>

                              <Grid item xs={12} md={4}>
                                {mappedValue ? (
                                  <Box
                                    sx={{
                                      p: 1,
                                      bgcolor: "success.50",
                                      borderRadius: 1,
                                      border: "1px solid",
                                      borderColor: "success.main",
                                    }}
                                  >
                                    <Typography
                                      variant="caption"
                                      color="success.dark"
                                      sx={{ fontWeight: 600 }}
                                    >
                                      Mapped Value:
                                    </Typography>
                                    <Typography variant="body2">
                                      {mappedValue.value}
                                    </Typography>
                                    {mappedValue.label && (
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ display: "block", mt: 0.5 }}
                                      >
                                        Source: {mappedValue.label}
                                      </Typography>
                                    )}
                                  </Box>
                                ) : (
                                  <Typography
                                    variant="caption"
                                    color="text.disabled"
                                  >
                                    No value mapped
                                  </Typography>
                                )}
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}

            {/* Tab 1: EUT Table Mapping */}
            {activeTab === 1 && (
              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Map EUT table columns from the document to Job Card columns.
                </Typography>

                {extractedTables.length === 0 ? (
                  <Alert severity="warning">No tables found in document</Alert>
                ) : getEutTableOptions().length === 0 ? (
                  <Alert severity="warning">
                    No EUT/DUT tables found in document. Please check if your
                    document contains a table with equipment details
                    (Nomenclature, Qty, Part No., Model No., Serial No.).
                  </Alert>
                ) : (
                  <>
                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <InputLabel>Select EUT/DUT Details Table</InputLabel>
                      <Select
                        value={
                          selectedEutTableIndex !== null
                            ? selectedEutTableIndex
                            : ""
                        }
                        onChange={(e) =>
                          setSelectedEutTableIndex(
                            e.target.value === "" ? null : e.target.value
                          )
                        }
                        label="Select EUT/DUT Table"
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {getEutTableOptions().map(({ table, index }) => (
                          <MenuItem key={index} value={index}>
                            {getTableDescription(table)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {selectedEutTableIndex !== null && (
                      <>
                        <Alert severity="info" sx={{ mb: 2 }}>
                          <strong>Selected Table Info:</strong> Table{" "}
                          {selectedEutTableIndex + 1} has{" "}
                          {extractedTables[selectedEutTableIndex].rows.length}{" "}
                          rows and{" "}
                          {extractedTables[selectedEutTableIndex].rows[0]
                            ?.length || 0}{" "}
                          columns
                          <br />
                          <strong>First Row (Headers):</strong>{" "}
                          {extractedTables[selectedEutTableIndex].rows[0]?.join(
                            ", "
                          )}
                        </Alert>

                        <Typography variant="subtitle2" sx={{ mb: 2 }}>
                          Map Columns:
                        </Typography>

                        <Grid container spacing={2}>
                          {EUT_COLUMNS.map((col) => {
                            const mappedColIndex = eutTableMapping[col.key];
                            const sourceTable =
                              extractedTables[selectedEutTableIndex];

                            return (
                              <Grid item xs={12} md={6} key={col.key}>
                                <Card variant="outlined">
                                  <CardContent sx={{ p: 2 }}>
                                    <Typography
                                      variant="subtitle2"
                                      color="primary"
                                      sx={{ mb: 1 }}
                                    >
                                      {col.label}
                                    </Typography>
                                    <FormControl fullWidth size="small">
                                      <InputLabel>
                                        Select Source Column
                                      </InputLabel>
                                      <Select
                                        value={
                                          mappedColIndex !== undefined
                                            ? mappedColIndex
                                            : ""
                                        }
                                        onChange={(e) =>
                                          handleColumnMappingChange(
                                            "eut",
                                            col.key,
                                            e.target.value
                                          )
                                        }
                                        label="Select Source Column"
                                      >
                                        <MenuItem value="">
                                          <em>None</em>
                                        </MenuItem>
                                        {sourceTable?.rows[0]?.map(
                                          (header, idx) => (
                                            <MenuItem key={idx} value={idx}>
                                              Column {idx + 1}: {header}
                                            </MenuItem>
                                          )
                                        )}
                                      </Select>
                                    </FormControl>
                                  </CardContent>
                                </Card>
                              </Grid>
                            );
                          })}
                        </Grid>

                        {/* Preview EUT Table */}
                        <Box sx={{ mt: 3 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Preview (first 3 rows):
                          </Typography>
                          <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: "#003366" }}>
                                  {EUT_COLUMNS.map((col) => (
                                    <TableCell
                                      key={col.key}
                                      sx={{
                                        color: "white",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      {col.label}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {extractedTables[selectedEutTableIndex].rows
                                  .slice(1, 4)
                                  .map((row, rowIdx) => (
                                    <TableRow key={rowIdx}>
                                      {EUT_COLUMNS.map((col) => {
                                        const colIndex =
                                          eutTableMapping[col.key];
                                        return (
                                          <TableCell key={col.key}>
                                            {colIndex !== undefined
                                              ? row[colIndex] || "-"
                                              : "-"}
                                          </TableCell>
                                        );
                                      })}
                                    </TableRow>
                                  ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      </>
                    )}
                  </>
                )}
              </Box>
            )}

            {/* Tab 2: Test Table Mapping */}
            {activeTab === 2 && (
              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Map Test details columns from the document to Job Card
                  columns.
                </Typography>

                {extractedTables.length === 0 ? (
                  <Alert severity="warning">No tables found in document</Alert>
                ) : getTestTableOptions().length === 0 ? (
                  <Alert severity="warning">
                    No Test details tables found in document. Please check if
                    your document contains a table with test details (Test Name,
                    Test Standard/Method, Test Profile).
                  </Alert>
                ) : (
                  <>
                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <InputLabel>Select Test Details Table</InputLabel>
                      <Select
                        value={
                          selectedTestTableIndex !== null
                            ? selectedTestTableIndex
                            : ""
                        }
                        onChange={(e) =>
                          setSelectedTestTableIndex(
                            e.target.value === "" ? null : e.target.value
                          )
                        }
                        label="Select Test Details Table"
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {getTestTableOptions().map(({ table, index }) => (
                          <MenuItem key={index} value={index}>
                            {getTableDescription(table)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {selectedTestTableIndex !== null && (
                      <>
                        <Alert severity="info" sx={{ mb: 2 }}>
                          <strong>Selected Table Info:</strong> Table{" "}
                          {selectedTestTableIndex + 1} has{" "}
                          {extractedTables[selectedTestTableIndex].rows.length}{" "}
                          rows and{" "}
                          {extractedTables[selectedTestTableIndex].rows[0]
                            ?.length || 0}{" "}
                          columns
                          <br />
                          <strong>First Row (Headers):</strong>{" "}
                          {extractedTables[
                            selectedTestTableIndex
                          ].rows[0]?.join(", ")}
                        </Alert>

                        <Typography variant="subtitle2" sx={{ mb: 2 }}>
                          Map Columns:
                        </Typography>

                        <Grid container spacing={2}>
                          {TEST_COLUMNS.map((col) => {
                            const mappedColIndex = testTableMapping[col.key];
                            const sourceTable =
                              extractedTables[selectedTestTableIndex];

                            return (
                              <Grid item xs={12} md={6} key={col.key}>
                                <Card variant="outlined">
                                  <CardContent sx={{ p: 2 }}>
                                    <Typography
                                      variant="subtitle2"
                                      color="primary"
                                      sx={{ mb: 1 }}
                                    >
                                      {col.label}
                                    </Typography>
                                    <FormControl fullWidth size="small">
                                      <InputLabel>
                                        Select Source Column
                                      </InputLabel>
                                      <Select
                                        value={
                                          mappedColIndex !== undefined
                                            ? mappedColIndex
                                            : ""
                                        }
                                        onChange={(e) =>
                                          handleColumnMappingChange(
                                            "test",
                                            col.key,
                                            e.target.value
                                          )
                                        }
                                        label="Select Source Column"
                                      >
                                        <MenuItem value="">
                                          <em>None</em>
                                        </MenuItem>
                                        {sourceTable?.rows[0]?.map(
                                          (header, idx) => (
                                            <MenuItem key={idx} value={idx}>
                                              Column {idx + 1}: {header}
                                            </MenuItem>
                                          )
                                        )}
                                      </Select>
                                    </FormControl>
                                  </CardContent>
                                </Card>
                              </Grid>
                            );
                          })}
                        </Grid>

                        {/* Preview Test Table */}
                        <Box sx={{ mt: 3 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Preview (first 3 rows):
                          </Typography>
                          <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                              <TableHead>
                                <TableRow sx={{ bgcolor: "#003366" }}>
                                  {TEST_COLUMNS.map((col) => (
                                    <TableCell
                                      key={col.key}
                                      sx={{
                                        color: "white",
                                        fontWeight: "bold",
                                      }}
                                    >
                                      {col.label}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {extractedTables[selectedTestTableIndex].rows
                                  .slice(1, 4)
                                  .map((row, rowIdx) => (
                                    <TableRow key={rowIdx}>
                                      {TEST_COLUMNS.map((col) => {
                                        const colIndex =
                                          testTableMapping[col.key];
                                        return (
                                          <TableCell key={col.key}>
                                            {colIndex !== undefined
                                              ? row[colIndex] || "-"
                                              : "-"}
                                          </TableCell>
                                        );
                                      })}
                                    </TableRow>
                                  ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      </>
                    )}
                  </>
                )}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} variant="contained" color="secondary">
          Cancel
        </Button>
        <Button
          onClick={handleConfirmImport}
          variant="contained"
          color="primary"
          startIcon={<CheckCircleIcon />}
        >
          Import to Job Card
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SRFImportDialog;
