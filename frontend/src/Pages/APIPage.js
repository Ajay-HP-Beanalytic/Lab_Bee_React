
// Api's used in quotations and Quotations Dashboard page:

// API To add new quotation and fetch the data and edit/update the data associated with the quotation id :
const apiToAddAndUpdateQuotation = `http://localhost:4000/api/quotation/`

// API to fetch the companies list in dropdown:
const apiToFetchCompanyList = `http://localhost:4000/api/getCompanyIdList`

// API to prefill the companies data in the quotation form:
const apiToFetchCompanyDetails = `http://localhost:4000/api/getCompanyDetails/`

//API to fetch the latest or last quotation ID:
const apiToFetchLatestQuoteID = "http://localhost:4000/api/getLatestQuoationID"

// API to fetch the logged in user name:
const apiToGetLoggedInUserName = 'http://localhost:4000/api/getLoggedInUser'

// API to fetch quotations data to create quote table:
const apiToFetchQuotesDataToCreateTable = "http://localhost:4000/api/getQuotationdata?"

// API to add new company details for quotaton purpose:
const apiToAddNewCompanyData = "http://localhost:4000/api/addNewCompanyDetails/"

// API to get company details based on the company id for quotaton purpose in AddCustomerDetails page:
const apiToGetCompanyDetails = "http://localhost:4000/api/getCompanyDetails"

//API to add item soft modules:
const apiToAddItemSoftModule = "http://localhost:4000/api/addItemsoftModules/"

// To fetch Item Soft Modules list:
const apiToGetItemSoftModulesList = `http://localhost:4000/api/getItemsoftModules/`





export {
    apiToAddAndUpdateQuotation, apiToFetchCompanyList, apiToFetchCompanyDetails,
    apiToFetchLatestQuoteID, apiToGetLoggedInUserName,
    apiToFetchQuotesDataToCreateTable, apiToAddNewCompanyData, apiToGetCompanyDetails,
    apiToAddItemSoftModule, apiToGetItemSoftModulesList,
};