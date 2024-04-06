

let months_list = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const getCurrentMonthYear = () => {
  const currentDate = new Date();
  const month = months_list[currentDate.getMonth()];
  const year = currentDate.getFullYear();

  return `${month}-${year}`
}
