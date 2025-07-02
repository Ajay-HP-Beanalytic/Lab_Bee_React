const emiChamberTestData = [
  {
    id: 1,
    slNo: 1,
    chamberName: "Main Chamber",
    standards: [
      {
        id: 1,
        standardName: "MIL STD 461 E/F/G",
        tests: [
          { id: 1, testName: "CE101" },
          { id: 2, testName: "CE102" },
          { id: 3, testName: "CS114" },
          { id: 4, testName: "RE101" },
          { id: 5, testName: "RE102" },
          { id: 6, testName: "RS103" },
        ],
      },
      {
        id: 2,
        standardName: "CISPR 25 / AIS-004",
        tests: [
          { id: 7, testName: "CE" },
          { id: 8, testName: "RE" },
        ],
      },
      {
        id: 3,
        standardName: "ISO 11452-2",
        tests: [{ id: 9, testName: "RS" }],
      },
      {
        id: 4,
        standardName: "ISO 11452-4",
        tests: [{ id: 10, testName: "CS" }],
      },
    ],
  },

  {
    id: 2,
    slNo: 2,
    chamberName: "CS LAB1",
    standards: [
      {
        id: 5,
        standardName: "MIL STD 461 E/F/G",
        tests: [
          { id: 11, testName: "CS101" },
          { id: 12, testName: "CS115" },
          { id: 13, testName: "CS116" },
          { id: 14, testName: "RS101" },
        ],
      },
    ],
  },

  {
    id: 3,
    slNo: 3,
    chamberName: "CS LAB2",
    standards: [
      {
        id: 6,
        standardName: "MIL STD 461 G",
        tests: [{ id: 15, testName: "CS118" }],
      },
      {
        id: 7,
        standardName: "ISO 10605",
        tests: [{ id: 16, testName: "ESD" }],
      },
      {
        id: 8,
        standardName: "IEC 61000-4-2",
        tests: [{ id: 17, testName: "ESD" }],
      },
    ],
  },
];

// Helper functions to retrieve data based on selections

// 1. Get all chambers for dropdown
const getAllEMIChambers = () => {
  return emiChamberTestData.map((chamber) => ({
    id: chamber.id,
    name: chamber.chamberName,
  }));
};

// 2. Get standards based on selected chamber
const getEMIStandardsByChamber = (chamberId) => {
  const chamber = emiChamberTestData.find((c) => c.id === chamberId);
  // console.log("chamber", chamber);
  if (!chamber) return [];

  return chamber.standards.map((standard) => ({
    id: standard.id,
    name: standard.standardName,
  }));
};

// 3. Get tests based on selected chamber and standard
const getTestsByStandard = (chamberId, standardId) => {
  const chamber = emiChamberTestData.find((c) => c.id === chamberId);
  if (!chamber) return [];

  const standard = chamber.standards.find((s) => s.id === standardId);
  if (!standard) return [];

  return standard.tests.map((test) => ({
    id: test.id,
    name: test.testName,
  }));
};

// 4. Get all tests for a specific chamber (across all standards)
const getAllTestsByChamber = (chamberId) => {
  const chamber = emiChamberTestData.find((c) => c.id === chamberId);
  if (!chamber) return [];

  const allTests = [];
  chamber.standards.forEach((standard) => {
    standard.tests.forEach((test) => {
      allTests.push({
        id: test.id,
        name: test.testName,
        standard: standard.standardName,
      });
    });
  });

  return allTests;
};

// 5. Get complete chamber info with all nested data
const getChamberDetails = (chamberId) => {
  return emiChamberTestData.find((c) => c.id === chamberId) || null;
};

// 6. Search functionality
const searchTests = (searchTerm) => {
  const results = [];

  emiChamberTestData.forEach((chamber) => {
    chamber.standards.forEach((standard) => {
      standard.tests.forEach((test) => {
        if (test.testName.toLowerCase().includes(searchTerm.toLowerCase())) {
          results.push({
            chamber: chamber.chamberName,
            standard: standard.standardName,
            test: test.testName,
            chamberId: chamber.id,
            standardId: standard.id,
            testId: test.id,
          });
        }
      });
    });
  });

  return results;
};

// Example usage functions

// Usage Example 1: Basic dropdown population
// console.log("All Chambers:", getAllEMIChambers());
// Output: [
//   { id: 1, name: "Main Chamber" },
//   { id: 2, name: "CS LAB1" },
//   { id: 3, name: "CS LAB2" }
// ]

// Usage Example 2: Get standards for Main Chamber
// console.log("Standards for Main Chamber:", getEMIStandardsByChamber(1));
// Output: [
//   { id: 1, name: "MIL STD 461 E/F/G" },
//   { id: 2, name: "CISPR 25 / AIS-004" },
//   { id: 3, name: "ISO 11452-2" },
//   { id: 4, name: "ISO 11452-4" }
// ]

// Usage Example 3: Get tests for Main Chamber + MIL STD 461 E/F/G
// console.log("Tests for Main Chamber - MIL STD:", getTestsByStandard(1, 1));
// Output: [
//   { id: 1, name: "CE101" },
//   { id: 2, name: "CE102" },
//   { id: 3, name: "CS114" },
//   { id: 4, name: "RE101" },
//   { id: 5, name: "RE102" },
//   { id: 6, name: "RS103" }
// ]

// Usage Example 4: Search for specific test
// console.log("Search 'ESD':", searchTests("ESD"));
// Output: [
//   { chamber: "CS LAB2", standard: "ISO 10605", test: "ESD", ... },
//   { chamber: "CS LAB2", standard: "IEC 61000-4-2", test: "ESD", ... }
// ]

// Export the data and functions
export {
  emiChamberTestData,
  getAllEMIChambers,
  getEMIStandardsByChamber,
  getTestsByStandard,
  getAllTestsByChamber,
  getChamberDetails,
  searchTests,
};

// Alternative: If you prefer a more flat structure for easier querying
const flatChamberTestData = [
  // Main Chamber
  {
    chamberId: 1,
    chamberName: "Main Chamber",
    standardId: 1,
    standardName: "MIL STD 461 E/F/G",
    testId: 1,
    testName: "CE101",
  },
  {
    chamberId: 1,
    chamberName: "Main Chamber",
    standardId: 1,
    standardName: "MIL STD 461 E/F/G",
    testId: 2,
    testName: "CE102",
  },
  {
    chamberId: 1,
    chamberName: "Main Chamber",
    standardId: 1,
    standardName: "MIL STD 461 E/F/G",
    testId: 3,
    testName: "CS114",
  },
  {
    chamberId: 1,
    chamberName: "Main Chamber",
    standardId: 1,
    standardName: "MIL STD 461 E/F/G",
    testId: 4,
    testName: "RE101",
  },
  {
    chamberId: 1,
    chamberName: "Main Chamber",
    standardId: 1,
    standardName: "MIL STD 461 E/F/G",
    testId: 5,
    testName: "RE102",
  },
  {
    chamberId: 1,
    chamberName: "Main Chamber",
    standardId: 1,
    standardName: "MIL STD 461 E/F/G",
    testId: 6,
    testName: "RS103",
  },
  {
    chamberId: 1,
    chamberName: "Main Chamber",
    standardId: 2,
    standardName: "CISPR 25 / AIS-004",
    testId: 7,
    testName: "CE",
  },
  {
    chamberId: 1,
    chamberName: "Main Chamber",
    standardId: 2,
    standardName: "CISPR 25 / AIS-004",
    testId: 8,
    testName: "RE",
  },
  {
    chamberId: 1,
    chamberName: "Main Chamber",
    standardId: 3,
    standardName: "ISO 11452-2",
    testId: 9,
    testName: "RS",
  },
  {
    chamberId: 1,
    chamberName: "Main Chamber",
    standardId: 4,
    standardName: "ISO 11452-4",
    testId: 10,
    testName: "CS",
  },

  // CS LAB1
  {
    chamberId: 2,
    chamberName: "CS LAB1",
    standardId: 5,
    standardName: "MIL STD 461 E/F/G",
    testId: 11,
    testName: "CS101",
  },
  {
    chamberId: 2,
    chamberName: "CS LAB1",
    standardId: 5,
    standardName: "MIL STD 461 E/F/G",
    testId: 12,
    testName: "CS115",
  },
  {
    chamberId: 2,
    chamberName: "CS LAB1",
    standardId: 5,
    standardName: "MIL STD 461 E/F/G",
    testId: 13,
    testName: "CS116",
  },
  {
    chamberId: 2,
    chamberName: "CS LAB1",
    standardId: 5,
    standardName: "MIL STD 461 E/F/G",
    testId: 14,
    testName: "RS101",
  },

  // CS LAB2
  {
    chamberId: 3,
    chamberName: "CS LAB2",
    standardId: 6,
    standardName: "MIL STD 461 G",
    testId: 15,
    testName: "CS118",
  },
  {
    chamberId: 3,
    chamberName: "CS LAB2",
    standardId: 7,
    standardName: "ISO 10605",
    testId: 16,
    testName: "ESD",
  },
  {
    chamberId: 3,
    chamberName: "CS LAB2",
    standardId: 8,
    standardName: "IEC 61000-4-2",
    testId: 17,
    testName: "ESD",
  },
];

// Helper functions for flat structure
const getFlatStandardsByChamber = (chamberId) => {
  const standards = [
    ...new Set(
      flatChamberTestData
        .filter((item) => item.chamberId === chamberId)
        .map((item) => ({ id: item.standardId, name: item.standardName }))
        .map((item) => JSON.stringify(item))
    ),
  ].map((item) => JSON.parse(item));

  return standards;
};

const getFlatTestsByStandard = (chamberId, standardId) => {
  return flatChamberTestData
    .filter(
      (item) => item.chamberId === chamberId && item.standardId === standardId
    )
    .map((item) => ({ id: item.testId, name: item.testName }));
};

// Export flat structure as well
export {
  flatChamberTestData,
  getFlatStandardsByChamber,
  getFlatTestsByStandard,
};
