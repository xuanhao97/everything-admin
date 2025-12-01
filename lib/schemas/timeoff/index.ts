import { z } from "zod";

// Purpose: Zod schemas for timeoff service validation
// - Validates timeoff list options input
// - Validates API response data structure

// Schemas for timeoff fields
export const TimeoffStatusEnum = z.string();
export const TimeoffMetatypeEnum = z.string();
export const TimeoffTypeEnum = z.string();
export const TimeoffStageEnum = z.string();
export const TimesheetMetatypeEnum = z.string();
export const LeaveFundEnum = z.string();
export const LoadShiftsMethodEnum = z.string();

// Schema for timeoff list options
export const getTimeoffListOptionsSchema = z.object({
  accessToken: z.string().min(1, "Access token cannot be empty").optional(),
  cookie: z.string().optional(),
});

// Schema for ACL (Access Control List)
export const aclSchema = z.object({
  approve: z.number().nullable().optional(),
  confirm: z.number().nullable().optional(),
  cancel: z.number().nullable().optional(),
  remove: z.number().nullable().optional(),
});

// Schema for Owner
export const ownerSchema = z.object({
  username: z.string().nullable().optional(),
  gavatar: z.string().nullable().optional(),
  approved: z.number().nullable().optional(),
});

// Schema for Shift2
export const shift2Schema = z.object({
  key: z.number().nullable().optional(),
  value: z.string().nullable().optional(),
  hours_per_day: z.string().nullable().optional(),
  points_per_day: z.string().nullable().optional(),
  num_shifts: z.string().nullable().optional(),
  timesheet_metatype: TimesheetMetatypeEnum.nullable().optional(),
  leave_fund: LeaveFundEnum.nullable().optional(),
  num_leave: z.number().nullable().optional(),
  standard_point: z.string().nullable().optional(),
  load_shifts_method: LoadShiftsMethodEnum.nullable().optional(),
});

// Schema for Shift
export const shiftSchema = z.object({
  datetime: z.number().nullable().optional(),
  shifts: z.array(shift2Schema).nullable().optional(),
});

// Schema for timeoff item
export const timeoffItemSchema = z
  .object({
    id: z.string().nullable().optional(),
    following_id: z.string().nullable().optional(),
    user_id: z.string().nullable().optional(),
    username: z.string().nullable().optional(),
    creator_id: z.string().nullable().optional(),
    creator_username: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    group_id: z.string().nullable().optional(),
    metatype: TimeoffMetatypeEnum.nullable().optional(),
    type: TimeoffTypeEnum.nullable().optional(),
    content: z.string().nullable().optional(),
    status: TimeoffStatusEnum.nullable().optional(),
    locked: z.string().nullable().optional(),
    warning: z.string().nullable().optional(),
    confirm: z.string().nullable().optional(),
    shifts: z.array(shiftSchema).nullable().optional(),
    display_shifts: z.array(z.unknown()).nullable().optional(),
    start_date: z.string().nullable().optional(),
    end_date: z.string().nullable().optional(),
    deadline: z.string().nullable().optional(),
    deadline_confirm: z.string().nullable().optional(),
    following: z.string().nullable().optional(),
    sending: z.string().nullable().optional(),
    receiving: z.string().nullable().optional(),
    reviewing: z.string().nullable().optional(),
    bookmark: z.string().nullable().optional(),
    stage: TimeoffStageEnum.nullable().optional(),
    owners: z.array(ownerSchema).nullable().optional(),
    approvals: z.array(z.string().nullable()).nullable().optional(),
    rejections: z.array(z.unknown()).nullable().optional(),
    since: z.string().nullable().optional(),
    last_update: z.string().nullable().optional(),
    abs_link: z.string().nullable().optional(),
    authorizing: z.string().nullable().optional(),
    authorized_user_id: z.string().nullable().optional(),
    acl: aclSchema.nullable().optional(),
  })
  .passthrough();

// Schema for timeoff list response data (Base API response structure)
export const timeoffListDataSchema = z.object({
  code: z.number().nullable().optional(),
  message: z.string().nullable().optional(),
  data: z.unknown().nullable().optional(),
  httpCode: z.string().nullable().optional(),
  timeoffs: z.array(timeoffItemSchema).nullable().optional(),
});

// Schema for API response structure (wrapped service response)
export const timeoffListResponseSchema = z.object({
  success: z.boolean(),
  data: timeoffListDataSchema.optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

// Type exports
export type GetTimeoffListOptions = z.infer<typeof getTimeoffListOptionsSchema>;
export type TimeoffStatus = z.infer<typeof TimeoffStatusEnum>;
export type TimeoffMetatype = z.infer<typeof TimeoffMetatypeEnum>;
export type TimeoffType = z.infer<typeof TimeoffTypeEnum>;
export type TimeoffStage = z.infer<typeof TimeoffStageEnum>;
export type TimesheetMetatype = z.infer<typeof TimesheetMetatypeEnum>;
export type LeaveFund = z.infer<typeof LeaveFundEnum>;
export type LoadShiftsMethod = z.infer<typeof LoadShiftsMethodEnum>;
export type Acl = z.infer<typeof aclSchema>;
export type Owner = z.infer<typeof ownerSchema>;
export type Shift2 = z.infer<typeof shift2Schema>;
export type Shift = z.infer<typeof shiftSchema>;
export type TimeoffItem = z.infer<typeof timeoffItemSchema>;
export type TimeoffListData = z.infer<typeof timeoffListDataSchema>;
export type TimeoffListResponse = z.infer<typeof timeoffListResponseSchema>;
