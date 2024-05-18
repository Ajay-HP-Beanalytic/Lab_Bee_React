

const months_list = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const getCurrentMonthYear = () => {
  const currentDate = new Date();
  const month = months_list[currentDate.getMonth()];
  const year = currentDate.getFullYear();

  return `${month}-${year}`
}


const fin_months_list = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

// export const getFinancialYear = () => {
//   const currentDate = new Date();
//   const month = fin_months_list[currentDate.getMonth()];
//   const year = currentDate.getFullYear();

//   const isBeforeApril = currentDate.getMonth() < fin_months_list.indexOf('Apr');

//   const startYear = isBeforeApril ? year - 1 : year;
//   const endYear = isBeforeApril ? year : year + 1;


//   console.log('isBeforeApril', isBeforeApril)
//   console.log('startYear', startYear)
//   console.log('endYear', endYear)
//   console.log(`${month}-${startYear} to ${month}-${endYear}`)


//   return `${month}-${startYear} to ${month}-${endYear}`;
// }


export const getFinancialYear = () => {
  const currentDate = new Date();
  const currentMonthIndex = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const startYear = currentMonthIndex < 3 ? currentYear - 1 : currentYear;
  const endYear = currentMonthIndex < 3 ? currentYear : currentYear + 1;

  const startMonth = currentMonthIndex < 3 ? 'Apr' : 'Apr';
  const endMonth = currentMonthIndex < 3 ? 'Mar' : 'Mar';

  return `${startMonth}-${startYear} to ${endMonth}-${endYear}`;
};



