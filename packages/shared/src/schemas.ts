import { z } from 'zod';

export const roleSchema = z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']);
export type Role = z.infer<typeof roleSchema>;

export const estimateStatusSchema = z.enum([
  'DRAFT',
  'SENT',
  'ACCEPTED',
  'DECLINED',
  'INVOICED',
]);

export const invoiceStatusSchema = z.enum(['DRAFT', 'SENT', 'PAID', 'VOID']);

export const leadSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  message: z.string().min(3),
  source: z.enum(['CONTACT', 'REQUEST_ESTIMATE']).default('CONTACT'),
  jobAddress: z.string().optional(),
  movingDate: z.string().optional(),
});

export const customerSnapshotSchema = z.object({
  name: z.string().min(2),
  jobAddress: z.string().min(3),
  phone: z.string().min(6),
  email: z.string().email(),
});

export const bedroomSchema = z.object({
  beds: z.number().int().min(1).max(6).default(1),
});

export const roomsSchema = z.object({
  kitchenQty: z.number().int().min(0).default(0),
  diningRoomQty: z.number().int().min(0).default(0),
  livingRoomQty: z.number().int().min(0).default(0),
  bathroomsQty: z.number().int().min(0).default(0),
  masterBathroomsQty: z.number().int().min(0).default(0),
  bedrooms: z.array(bedroomSchema).default([]),
});

export const createEstimateSchema = z.object({
  customer: customerSnapshotSchema,
  movingDate: z.string().min(1),
  rooms: roomsSchema,
  notes: z.string().optional(),
});

export const updateEstimateStatusSchema = z.object({
  status: estimateStatusSchema,
});

export const createEmployeeSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6),
  role: roleSchema,
  userId: z.string().optional(),
});

export const createTimeEntrySchema = z.object({
  employeeId: z.string().min(1),
  clockIn: z.string().optional(),
  clockOut: z.string().optional(),
});

export const punchClockSchema = z.object({
  employeeId: z.string().min(1),
  action: z.enum(['IN', 'OUT']),
  geolocationEnabled: z.boolean().default(false),
});

export const createJobSchema = z.object({
  title: z.string().min(2),
  address: z.string().min(3),
  startDateTime: z.string().min(1),
  endDateTime: z.string().min(1),
  estimateId: z.string().optional(),
  employeeIds: z.array(z.string()).default([]),
});

export const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LeadInput = z.infer<typeof leadSchema>;
export type CreateEstimateInput = z.infer<typeof createEstimateSchema>;
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type CredentialsInput = z.infer<typeof credentialsSchema>;
