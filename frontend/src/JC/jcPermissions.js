/**
 * Who may edit a closed TS1 job card (report numbers, report delivery status, invoice...):
 * Administration, the Lab Manager, Accounts, the Reports team and the Quality team.
 * Reopening it stays with the Lab Manager / Administration (the status field).
 * Keep in step with Backend/ts1/jobcardRows.js (canEditClosed), which checks it on save.
 */
export const canEditClosedJobcard = ({ department, role, isAdmin } = {}) =>
  !!isAdmin ||
  department === "Administration" ||
  role === "Lab Manager" ||
  /accounts|reports|scrutiny|quality/i.test(String(department || "")) ||
  /quality|reports|scrutiny/i.test(String(role || ""));
