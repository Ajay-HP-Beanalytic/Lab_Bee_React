// Api's used in quotations and Quotations Dashboard page:

// Server base address from environment variable
// Configured in .env file
// For development: http://localhost:4001
// For production: https://labbee.beanalytic.com:4002
const serverBaseAddress = process.env.REACT_APP_SERVER_BASE_ADDRESS || "http://localhost:4001";

export { serverBaseAddress };
