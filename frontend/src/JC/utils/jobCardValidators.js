import dayjs from "dayjs";
import { toast } from "react-toastify";

/**
 * Job Card validation utilities
 */

export const jobCardValidators = {
  /**
   * Validate Job Card form data before submission
   */
  validateJobCard: (data) => {
    const errors = [];

    // Required field validations
    if (!data.jcOpenDate) {
      errors.push({
        field: "jcOpenDate",
        message: "Job-Card Open Date is required",
      });
    }

    // Status-specific validations
    if (data.jcStatus === "Closed" && !data.jcCloseDate) {
      errors.push({
        field: "jcCloseDate",
        message: "Job-Card Close Date is required when status is Closed",
      });
    }

    // Date logic validations
    if (data.jcCloseDate && data.jcOpenDate) {
      if (dayjs(data.jcCloseDate).isBefore(dayjs(data.jcOpenDate))) {
        errors.push({
          field: "jcCloseDate",
          message: "Close Date cannot be earlier than Open Date",
        });
      }
    }

    return errors;
  },

  /**
   * Show validation errors as toast messages
   */
  showValidationErrors: (errors) => {
    errors.forEach((error) => {
      toast.warning(error.message);
    });
  },

  /**
   * Validate email format
   */
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate phone number format
   */
  isValidPhone: (phone) => {
    const phoneRegex = /^[\d+\-\s()]{10,15}$/;
    return phoneRegex.test(phone);
  },

  /**
   * Validate date is not in future
   */
  isNotFutureDate: (date) => {
    return !dayjs(date).isAfter(dayjs(), "day");
  },

  /**
   * Validate date is within a specific range
   */
  isDateInRange: (date, startDate, endDate) => {
    const checkDate = dayjs(date);
    return (
      checkDate.isAfter(dayjs(startDate), "day") &&
      checkDate.isBefore(dayjs(endDate), "day")
    );
  },
};

export default jobCardValidators;
