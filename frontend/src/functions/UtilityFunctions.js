const months_list = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const getCurrentMonthYear = () => {
  const currentDate = new Date();
  const month = months_list[currentDate.getMonth()];
  const year = currentDate.getFullYear();

  // return `${month}-${year}`
  return { month, year };
};

export const getFinancialYear = () => {
  const currentDate = new Date();
  const currentMonthIndex = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const startYear = currentMonthIndex < 3 ? currentYear - 1 : currentYear;
  const endYear = currentMonthIndex < 3 ? currentYear : currentYear + 1;

  const startMonth = currentMonthIndex < 3 ? "Apr" : "Apr";
  const endMonth = currentMonthIndex < 3 ? "Mar" : "Mar";

  return `${startMonth}-${startYear} to ${endMonth}-${endYear}`;
};

//Function add serial numbers to the rows
export const addSerialNumbersToRows = (data) => {
  return data.map((item, index) => ({
    ...item,
    serialNumbers: index + 1,
  }));
};
