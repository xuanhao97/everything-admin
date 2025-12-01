// Purpose: Constants for timeoff service
// - Defines all timeoff-related constant values
// - Organized as objects for better structure and access

export const TIMEOFF_STATUS = {
  STATUS_0: "0",
  STATUS_10: "10",
} as const;

export const TIMEOFF_METATYPE = {
  ANNUAL: "annual",
  UNPAID: "unpaid",
  OTHER: "other",
} as const;

export const TIMEOFF_TYPE = {
  SHIFT: "shift",
} as const;

export const TIMEOFF_STAGE = {
  STAGE_0: "0",
  STAGE_10: "10",
} as const;

export const TIMESHEET_METATYPE = {
  TIMESHEET: "timesheet",
} as const;

export const LEAVE_FUND = {
  ANNUAL: "annual",
  UNPAID: "unpaid",
  OTHER: "other",
} as const;

export const LOAD_SHIFTS_METHOD = {
  ACTUAL: "actual",
} as const;
