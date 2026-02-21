import {
  calculateEstimatePricing,
  createEmployeeSchema,
  createEstimateSchema,
  createJobSchema,
  estimateStatusSchema,
  invoiceStatusSchema,
  leadSchema,
} from '@finishing-touch/shared';
import type { EstimateStatus, InvoiceStatus } from '@/types/models';
import { CURRENCY_SYMBOL } from './env';
import { createSupabaseClient } from './supabase';

type RequestOptions = {
  token?: string;
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

type DbRow = Record<string, unknown>;

type EstimateRecord = DbRow & {
  id: string;
  number: string;
  status: EstimateStatus;
  movingDate: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerJobAddress: string;
  notes: string | null;
  subtotal: number;
  tax: number;
  total: number;
  currencySymbol: string;
};

type EstimateLineItemRecord = DbRow & {
  id: string;
  estimateId: string;
  description: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  metadata?: Record<string, unknown>;
};

type InvoiceRecord = DbRow & {
  id: string;
  number: string;
  status: InvoiceStatus;
  derivedFromEstimateId: string | null;
  subtotal: number;
  tax: number;
  total: number;
  currencySymbol: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerJobAddress: string;
  createdAt: string;
};

type InvoiceLineItemRecord = DbRow & {
  id: string;
  invoiceId: string;
  description: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  metadata?: Record<string, unknown>;
};

const errorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Request failed';
};

const nowIso = (): string => new Date().toISOString();

const rowId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
};

const postInternalEmail = async (
  path: '/api/email/lead' | '/api/email/estimate',
  payload: unknown,
) => {
  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  let responseBody: { message?: string } | null = null;
  try {
    responseBody = (await response.json()) as { message?: string };
  } catch {
    responseBody = null;
  }

  if (!response.ok) {
    throw new Error(
      responseBody?.message || `Email request failed with status ${response.status}`,
    );
  }
};

const sequenceFromNumber = (value: string | null | undefined): number => {
  if (!value) {
    return 0;
  }

  const match = value.match(/-(\d+)$/);
  return match ? Number(match[1]) : 0;
};

const nextEstimateNumber = async (token?: string): Promise<string> => {
  const supabase = createSupabaseClient(token);

  const { data, error } = await supabase
    .from('Estimate')
    .select('number')
    .order('createdAt', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const next = sequenceFromNumber((data as { number?: string } | null)?.number) + 1;
  return `EST-${String(next).padStart(6, '0')}`;
};

const nextInvoiceNumber = async (token?: string): Promise<string> => {
  const supabase = createSupabaseClient(token);

  const { data, error } = await supabase
    .from('Invoice')
    .select('number')
    .order('createdAt', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const next = sequenceFromNumber((data as { number?: string } | null)?.number) + 1;
  return `INV-${String(next).padStart(6, '0')}`;
};

const withEstimateLineItems = async (
  estimates: EstimateRecord[],
  token?: string,
): Promise<Array<EstimateRecord & { lineItems: EstimateLineItemRecord[] }>> => {
  if (estimates.length === 0) {
    return [];
  }

  const supabase = createSupabaseClient(token);
  const estimateIds = estimates.map((estimate) => estimate.id);

  const { data: items, error } = await supabase
    .from('EstimateLineItem')
    .select('*')
    .in('estimateId', estimateIds);

  if (error) {
    throw new Error(error.message);
  }

  const byEstimate = new Map<string, EstimateLineItemRecord[]>();
  for (const item of (items || []) as EstimateLineItemRecord[]) {
    const existing = byEstimate.get(item.estimateId) || [];
    existing.push(item);
    byEstimate.set(item.estimateId, existing);
  }

  return estimates.map((estimate) => ({
    ...estimate,
    lineItems: byEstimate.get(estimate.id) || [],
  }));
};

const withInvoiceLineItems = async (
  invoices: InvoiceRecord[],
  token?: string,
): Promise<Array<InvoiceRecord & { lineItems: InvoiceLineItemRecord[] }>> => {
  if (invoices.length === 0) {
    return [];
  }

  const supabase = createSupabaseClient(token);
  const invoiceIds = invoices.map((invoice) => invoice.id);

  const { data: items, error } = await supabase
    .from('InvoiceLineItem')
    .select('*')
    .in('invoiceId', invoiceIds);

  if (error) {
    throw new Error(error.message);
  }

  const byInvoice = new Map<string, InvoiceLineItemRecord[]>();
  for (const item of (items || []) as InvoiceLineItemRecord[]) {
    const existing = byInvoice.get(item.invoiceId) || [];
    existing.push(item);
    byInvoice.set(item.invoiceId, existing);
  }

  return invoices.map((invoice) => ({
    ...invoice,
    lineItems: byInvoice.get(invoice.id) || [],
  }));
};

const attachEmployees = async (
  entries: Array<DbRow & { employeeId: string }>,
  token?: string,
) => {
  if (entries.length === 0) {
    return [];
  }

  const supabase = createSupabaseClient(token);
  const employeeIds = [...new Set(entries.map((entry) => entry.employeeId))];

  const { data: employees, error } = await supabase
    .from('Employee')
    .select('*')
    .in('id', employeeIds);

  if (error) {
    throw new Error(error.message);
  }

  const byId = new Map<string, DbRow>(
    ((employees || []) as Array<DbRow & { id: string }>).map((employee) => [
      employee.id,
      employee,
    ]),
  );

  return entries.map((entry) => ({
    ...entry,
    employee: byId.get(entry.employeeId) || null,
  }));
};

const hydrateJobs = async (jobs: Array<DbRow & { id: string }>, token?: string) => {
  if (jobs.length === 0) {
    return [];
  }

  const supabase = createSupabaseClient(token);
  const jobIds = jobs.map((job) => job.id);

  const { data: assignments, error: assignmentError } = await supabase
    .from('JobAssignment')
    .select('*')
    .in('jobId', jobIds);

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  const assignmentRows = (assignments || []) as Array<DbRow & {
    id: string;
    jobId: string;
    employeeId: string;
  }>;

  const employeeIds = [...new Set(assignmentRows.map((row) => row.employeeId))];
  const { data: employees, error: employeeError } = await supabase
    .from('Employee')
    .select('*')
    .in('id', employeeIds.length ? employeeIds : ['']);

  if (employeeError && employeeIds.length > 0) {
    throw new Error(employeeError.message);
  }

  const employeeById = new Map<string, DbRow>(
    ((employees || []) as Array<DbRow & { id: string }>).map((employee) => [
      employee.id,
      employee,
    ]),
  );

  const assignmentsByJob = new Map<string, Array<DbRow>>();
  for (const assignment of assignmentRows) {
    const existing = assignmentsByJob.get(assignment.jobId) || [];
    existing.push({
      ...assignment,
      employee: employeeById.get(assignment.employeeId) || null,
    });
    assignmentsByJob.set(assignment.jobId, existing);
  }

  return jobs.map((job) => ({
    ...job,
    assignments: assignmentsByJob.get(job.id) || [],
  }));
};

const createLead = async (payload: unknown, token?: string) => {
  const data = leadSchema.parse(payload);
  const supabase = createSupabaseClient(token);

  const { data: inserted, error } = await supabase
    .from('Lead')
    .insert({
      id: rowId(),
      ...data,
      movingDate: data.movingDate || null,
      jobAddress: data.jobAddress || null,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  await postInternalEmail('/api/email/lead', {
    ...data,
    movingDate: data.movingDate || undefined,
    jobAddress: data.jobAddress || undefined,
  });

  return inserted;
};

const createEstimate = async (payload: unknown, token?: string) => {
  const data = createEstimateSchema.parse(payload);
  const supabase = createSupabaseClient(token);
  const updatedAt = nowIso();

  const pricing = calculateEstimatePricing(data.rooms);
  const number = await nextEstimateNumber(token);

  const { data: existingCustomer } = await supabase
    .from('Customer')
    .select('*')
    .eq('email', data.customer.email)
    .maybeSingle();

  let customerId: string | null = null;

  if (existingCustomer) {
    customerId = (existingCustomer as DbRow & { id: string }).id;
    const { error: updateCustomerError } = await supabase
      .from('Customer')
      .update({
        name: data.customer.name,
        phone: data.customer.phone,
        updatedAt,
      })
      .eq('id', customerId);

    if (updateCustomerError) {
      throw new Error(updateCustomerError.message);
    }
  } else {
    const { data: createdCustomer, error: customerError } = await supabase
      .from('Customer')
      .insert({
        id: rowId(),
        name: data.customer.name,
        email: data.customer.email,
        phone: data.customer.phone,
        updatedAt,
      })
      .select('id')
      .single();

    if (customerError) {
      throw new Error(customerError.message);
    }

    customerId = (createdCustomer as { id: string }).id;
  }

  const { data: estimate, error: estimateError } = await supabase
    .from('Estimate')
    .insert({
      id: rowId(),
      number,
      status: 'DRAFT',
      movingDate: new Date(data.movingDate).toISOString(),
      customerId,
      customerName: data.customer.name,
      customerPhone: data.customer.phone,
      customerEmail: data.customer.email,
      customerJobAddress: data.customer.jobAddress,
      notes: data.notes || null,
      subtotal: pricing.subtotal,
      tax: pricing.tax,
      total: pricing.total,
      currencySymbol: CURRENCY_SYMBOL,
      updatedAt,
    })
    .select('*')
    .single();

  if (estimateError) {
    throw new Error(estimateError.message);
  }

  const estimateId = (estimate as EstimateRecord).id;

  const { error: lineItemError } = await supabase.from('EstimateLineItem').insert(
    pricing.lineItems.map((item) => ({
      id: rowId(),
      estimateId,
      description: item.description,
      qty: item.qty,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      metadata: item.metadata || null,
    })),
  );

  if (lineItemError) {
    throw new Error(lineItemError.message);
  }

  const hydrated = await withEstimateLineItems([estimate as EstimateRecord], token);
  return hydrated[0];
};

const listEstimates = async (search: string, status: string, token?: string) => {
  const supabase = createSupabaseClient(token);

  let query = supabase.from('Estimate').select('*').order('createdAt', { ascending: false });

  if (status) {
    const parsedStatus = estimateStatusSchema.parse(status);
    query = query.eq('status', parsedStatus);
  }

  if (search) {
    query = query.or(`customerName.ilike.%${search}%,number.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return withEstimateLineItems((data || []) as EstimateRecord[], token);
};

const getEstimate = async (id: string, token?: string) => {
  const supabase = createSupabaseClient(token);
  const { data, error } = await supabase
    .from('Estimate')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const hydrated = await withEstimateLineItems([data as EstimateRecord], token);
  return hydrated[0];
};

const updateEstimate = async (id: string, payload: unknown, token?: string) => {
  const body = payload as { status?: EstimateStatus; notes?: string };
  const supabase = createSupabaseClient(token);

  const updateData: Record<string, unknown> = {};
  if (body.status) {
    updateData.status = estimateStatusSchema.parse(body.status);
  }
  if (body.notes !== undefined) {
    updateData.notes = body.notes || null;
  }
  updateData.updatedAt = nowIso();

  const { error } = await supabase.from('Estimate').update(updateData).eq('id', id);
  if (error) {
    throw new Error(error.message);
  }

  return getEstimate(id, token);
};

const deleteEstimate = async (id: string, token?: string) => {
  const supabase = createSupabaseClient(token);
  const { error } = await supabase.from('Estimate').delete().eq('id', id);
  if (error) {
    throw new Error(error.message);
  }

  return { ok: true };
};

const sendEstimate = async (id: string, token?: string) => {
  const estimate = await getEstimate(id, token);

  await postInternalEmail('/api/email/estimate', {
    id: estimate.id,
    number: estimate.number,
    movingDate: estimate.movingDate,
    customerName: estimate.customerName,
    customerEmail: estimate.customerEmail,
    customerPhone: estimate.customerPhone,
    customerJobAddress: estimate.customerJobAddress,
    subtotal: estimate.subtotal,
    tax: estimate.tax,
    total: estimate.total,
    currencySymbol: estimate.currencySymbol,
    lineItems: estimate.lineItems.map((item) => ({
      description: item.description,
      qty: item.qty,
      totalPrice: item.totalPrice,
    })),
  });

  return {
    ok: true,
    message: `Estimate ${estimate.number} emailed to ${estimate.customerEmail}.`,
  };
};

const convertEstimateToInvoice = async (id: string, token?: string) => {
  const supabase = createSupabaseClient(token);
  const updatedAt = nowIso();

  const estimate = await getEstimate(id, token);

  if (estimate.status === 'DECLINED') {
    throw new Error('Declined estimates cannot be invoiced');
  }

  const { data: existingInvoice } = await supabase
    .from('Invoice')
    .select('id')
    .eq('derivedFromEstimateId', id)
    .maybeSingle();

  if (existingInvoice) {
    return existingInvoice;
  }

  const number = await nextInvoiceNumber(token);

  const { data: invoice, error: invoiceError } = await supabase
    .from('Invoice')
    .insert({
      id: rowId(),
      number,
      status: 'DRAFT',
      derivedFromEstimateId: estimate.id,
      subtotal: estimate.subtotal,
      tax: estimate.tax,
      total: estimate.total,
      currencySymbol: estimate.currencySymbol,
      customerName: estimate.customerName,
      customerPhone: estimate.customerPhone,
      customerEmail: estimate.customerEmail,
      customerJobAddress: estimate.customerJobAddress,
      updatedAt,
    })
    .select('*')
    .single();

  if (invoiceError) {
    throw new Error(invoiceError.message);
  }

  const invoiceId = (invoice as InvoiceRecord).id;

  const { error: lineError } = await supabase.from('InvoiceLineItem').insert(
    (estimate.lineItems || []).map((item) => ({
      id: rowId(),
      invoiceId,
      description: item.description,
      qty: item.qty,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      metadata: item.metadata || null,
    })),
  );

  if (lineError) {
    throw new Error(lineError.message);
  }

  const { error: updateError } = await supabase
    .from('Estimate')
    .update({ status: 'INVOICED', updatedAt })
    .eq('id', id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return invoice;
};

const listInvoices = async (search: string, status: string, token?: string) => {
  const supabase = createSupabaseClient(token);

  let query = supabase.from('Invoice').select('*').order('createdAt', { ascending: false });

  if (status) {
    query = query.eq('status', invoiceStatusSchema.parse(status));
  }

  if (search) {
    query = query.or(`customerName.ilike.%${search}%,number.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return withInvoiceLineItems((data || []) as InvoiceRecord[], token);
};

const getInvoice = async (id: string, token?: string) => {
  const supabase = createSupabaseClient(token);
  const { data, error } = await supabase
    .from('Invoice')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const hydrated = await withInvoiceLineItems([data as InvoiceRecord], token);
  return hydrated[0];
};

const updateInvoice = async (id: string, payload: unknown, token?: string) => {
  const body = payload as { status?: InvoiceStatus };
  const supabase = createSupabaseClient(token);

  const { error } = await supabase
    .from('Invoice')
    .update({
      status: body.status ? invoiceStatusSchema.parse(body.status) : undefined,
      updatedAt: nowIso(),
    })
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  return getInvoice(id, token);
};

const deleteInvoice = async (id: string, token?: string) => {
  const supabase = createSupabaseClient(token);
  const { error } = await supabase.from('Invoice').delete().eq('id', id);
  if (error) {
    throw new Error(error.message);
  }

  return { ok: true };
};

const listEmployees = async (token?: string) => {
  const supabase = createSupabaseClient(token);
  const { data, error } = await supabase
    .from('Employee')
    .select('*')
    .order('createdAt', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
};

const createEmployee = async (payload: unknown, token?: string) => {
  const data = createEmployeeSchema.parse(payload);
  const supabase = createSupabaseClient(token);

  const { data: inserted, error } = await supabase
    .from('Employee')
    .insert({
      id: rowId(),
      ...data,
      updatedAt: nowIso(),
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return inserted;
};

const updateEmployee = async (id: string, payload: unknown, token?: string) => {
  const supabase = createSupabaseClient(token);
  const { error } = await supabase
    .from('Employee')
    .update({
      ...(payload as DbRow),
      updatedAt: nowIso(),
    })
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  const { data, error: fetchError } = await supabase
    .from('Employee')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  return data;
};

const deleteEmployee = async (id: string, token?: string) => {
  const supabase = createSupabaseClient(token);
  const { error } = await supabase.from('Employee').delete().eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  return { ok: true };
};

const getTimesheets = async (
  employeeId: string,
  from: string,
  to: string,
  token?: string,
) => {
  const supabase = createSupabaseClient(token);
  let query = supabase.from('TimeEntry').select('*').eq('employeeId', employeeId);

  if (from) {
    query = query.gte('clockIn', new Date(from).toISOString());
  }
  if (to) {
    query = query.lte('clockIn', new Date(`${to}T23:59:59.999Z`).toISOString());
  }

  const { data, error } = await query.order('clockIn', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const entries = await attachEmployees((data || []) as Array<DbRow & { employeeId: string }>, token);
  const totalMinutes = entries.reduce(
    (sum, entry) => sum + Number((entry as { durationMinutes?: number }).durationMinutes || 0),
    0,
  );

  return {
    entries,
    totalMinutes,
  };
};

const diffMinutes = (from: string, to: string): number =>
  Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60000));

const listTimeEntries = async (
  params: URLSearchParams,
  token?: string,
) => {
  const supabase = createSupabaseClient(token);
  let query = supabase.from('TimeEntry').select('*');

  const employeeId = params.get('employeeId');
  if (employeeId) {
    query = query.eq('employeeId', employeeId);
  }

  const from = params.get('from');
  if (from) {
    query = query.gte('clockIn', new Date(from).toISOString());
  }

  const to = params.get('to');
  if (to) {
    query = query.lte('clockIn', new Date(to).toISOString());
  }

  if (params.get('openOnly') === 'true') {
    query = query.is('clockOut', null);
  }

  const { data, error } = await query.order('clockIn', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return attachEmployees((data || []) as Array<DbRow & { employeeId: string }>, token);
};

const punchClock = async (payload: unknown, token?: string) => {
  const body = payload as {
    employeeId: string;
    action: 'IN' | 'OUT';
  };

  const supabase = createSupabaseClient(token);

  if (body.action === 'IN') {
    const { data: openEntry } = await supabase
      .from('TimeEntry')
      .select('*')
      .eq('employeeId', body.employeeId)
      .is('clockOut', null)
      .maybeSingle();

    if (openEntry) {
      throw new Error('Employee is already clocked in');
    }

    const { data: inserted, error } = await supabase
      .from('TimeEntry')
      .insert({
        id: rowId(),
        employeeId: body.employeeId,
        clockIn: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const hydrated = await attachEmployees([inserted as DbRow & { employeeId: string }], token);
    return hydrated[0];
  }

  const { data: openEntry, error: openError } = await supabase
    .from('TimeEntry')
    .select('*')
    .eq('employeeId', body.employeeId)
    .is('clockOut', null)
    .order('clockIn', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (openError) {
    throw new Error(openError.message);
  }

  if (!openEntry) {
    throw new Error('No open clock-in entry found');
  }

  const now = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from('TimeEntry')
    .update({
      clockOut: now,
      durationMinutes: diffMinutes(
        String((openEntry as DbRow & { clockIn: string }).clockIn),
        now,
      ),
    })
    .eq('id', (openEntry as DbRow & { id: string }).id)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const hydrated = await attachEmployees([updated as DbRow & { employeeId: string }], token);
  return hydrated[0];
};

const listClockedIn = async (token?: string) => {
  const entries = await listTimeEntries(new URLSearchParams('openOnly=true'), token);
  return entries;
};

const listJobs = async (params: URLSearchParams, token?: string) => {
  const supabase = createSupabaseClient(token);
  let query = supabase.from('Job').select('*');

  const from = params.get('from');
  if (from) {
    query = query.gte('startDateTime', new Date(from).toISOString());
  }

  const to = params.get('to');
  if (to) {
    query = query.lte('startDateTime', new Date(to).toISOString());
  }

  const { data, error } = await query.order('startDateTime', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return hydrateJobs((data || []) as Array<DbRow & { id: string }>, token);
};

const createJob = async (payload: unknown, token?: string) => {
  const data = createJobSchema.parse(payload);
  const supabase = createSupabaseClient(token);
  const updatedAt = nowIso();

  const { data: job, error } = await supabase
    .from('Job')
    .insert({
      id: rowId(),
      title: data.title,
      address: data.address,
      startDateTime: new Date(data.startDateTime).toISOString(),
      endDateTime: new Date(data.endDateTime).toISOString(),
      estimateId: data.estimateId || null,
      updatedAt,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (data.employeeIds.length) {
    const { error: assignmentError } = await supabase.from('JobAssignment').insert(
      data.employeeIds.map((employeeId) => ({
        id: rowId(),
        jobId: (job as DbRow & { id: string }).id,
        employeeId,
      })),
    );

    if (assignmentError) {
      throw new Error(assignmentError.message);
    }
  }

  const hydrated = await hydrateJobs([job as DbRow & { id: string }], token);
  return hydrated[0];
};

const createJobFromEstimate = async (
  estimateId: string,
  payload: unknown,
  token?: string,
) => {
  const body = (payload as { employeeIds?: string[] }) || {};
  const supabase = createSupabaseClient(token);
  const updatedAt = nowIso();

  const estimate = await getEstimate(estimateId, token);

  if (!['ACCEPTED', 'INVOICED'].includes(estimate.status)) {
    throw new Error('Only accepted estimates can be converted to jobs');
  }

  const start = new Date(estimate.movingDate);
  start.setHours(9, 0, 0, 0);
  const end = new Date(estimate.movingDate);
  end.setHours(17, 0, 0, 0);

  const { data: job, error } = await supabase
    .from('Job')
    .insert({
      id: rowId(),
      title: `Turnover Painting - ${estimate.customerName}`,
      address: estimate.customerJobAddress,
      startDateTime: start.toISOString(),
      endDateTime: end.toISOString(),
      estimateId,
      updatedAt,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (body.employeeIds?.length) {
    const { error: assignmentError } = await supabase.from('JobAssignment').insert(
      body.employeeIds.map((employeeId) => ({
        id: rowId(),
        jobId: (job as DbRow & { id: string }).id,
        employeeId,
      })),
    );

    if (assignmentError) {
      throw new Error(assignmentError.message);
    }
  }

  const hydrated = await hydrateJobs([job as DbRow & { id: string }], token);
  return hydrated[0];
};

const estimatePrintHtml = (estimate: Awaited<ReturnType<typeof getEstimate>>) => {
  const movingDate = new Date(estimate.movingDate).toLocaleDateString('en-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const logoSrc = typeof window !== 'undefined'
    ? `${window.location.origin}/logo-placeholder.png`
    : '/logo-placeholder.png';

  const rows = estimate.lineItems
    .map(
      (item) => `
      <tr>
        <td>${item.description}</td>
        <td style="text-align:right">${item.qty}</td>
        <td style="text-align:right">${estimate.currencySymbol}${Number(item.totalPrice).toLocaleString('en-US')}</td>
      </tr>
    `,
    )
    .join('');

  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${estimate.number}</title>
    <style>
      body{font-family:Arial,Helvetica,sans-serif;padding:30px;color:#1f2937}
      .sheet{border:1px solid #d1d5db;padding:24px}
      .header{display:flex;justify-content:space-between;align-items:flex-start}
      .logo{width:150px;height:auto}
      .meta{text-align:right}
      .number{font-size:20px;font-weight:700;margin-bottom:6px}
      .date{font-size:14px;color:#4b5563}
      .customer{margin-top:20px;margin-left:25px;line-height:1.6;font-size:14px}
      table{width:100%;border-collapse:collapse;margin-top:22px;font-size:14px}
      th,td{border:1px solid #d1d5db;padding:10px}
      th{text-align:left;background:#f9fafb}
      .totals{margin-top:18px;width:280px;margin-left:auto;font-size:14px}
      .totals div{display:flex;justify-content:space-between;padding:4px 0}
      .total{border-top:1px solid #111827;margin-top:6px;padding-top:8px;font-size:16px;font-weight:700}
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="header">
        <img class="logo" src="${logoSrc}" alt="Finishing Touch" />
        <div class="meta">
          <div class="number">${estimate.number}</div>
          <div class="date">Moving date: ${movingDate}</div>
        </div>
      </div>
      <div class="customer">
        <div><strong>${estimate.customerName}</strong></div>
        <div>${estimate.customerJobAddress}</div>
        <div>${estimate.customerPhone}</div>
        <div>${estimate.customerEmail}</div>
      </div>
      <table>
        <thead>
          <tr><th>Description</th><th>Qty</th><th>Price</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="totals">
        <div><span>Subtotal</span><span>${estimate.currencySymbol}${Number(estimate.subtotal).toLocaleString('en-US')}</span></div>
        <div><span>Tax</span><span>${estimate.currencySymbol}${Number(estimate.tax).toLocaleString('en-US')}</span></div>
        <div class="total"><span>Total</span><span>${estimate.currencySymbol}${Number(estimate.total).toLocaleString('en-US')}</span></div>
      </div>
    </div>
  </body>
</html>`;
};

const invoicePrintHtml = (invoice: Awaited<ReturnType<typeof getInvoice>>) => {
  const createdDate = new Date(invoice.createdAt).toLocaleDateString('en-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const logoSrc = typeof window !== 'undefined'
    ? `${window.location.origin}/logo-placeholder.png`
    : '/logo-placeholder.png';

  const rows = invoice.lineItems
    .map(
      (item) => `
      <tr>
        <td>${item.description}</td>
        <td style="text-align:right">${item.qty}</td>
        <td style="text-align:right">${invoice.currencySymbol}${Number(item.totalPrice).toLocaleString('en-US')}</td>
      </tr>
    `,
    )
    .join('');

  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${invoice.number}</title>
    <style>
      body{font-family:Arial,Helvetica,sans-serif;padding:30px;color:#1f2937}
      .sheet{border:1px solid #d1d5db;padding:24px}
      .header{display:flex;justify-content:space-between;align-items:flex-start}
      .logo{width:150px;height:auto}
      .meta{text-align:right}
      .number{font-size:20px;font-weight:700;margin-bottom:6px}
      .date{font-size:14px;color:#4b5563}
      .customer{margin-top:20px;margin-left:25px;line-height:1.6;font-size:14px}
      table{width:100%;border-collapse:collapse;margin-top:22px;font-size:14px}
      th,td{border:1px solid #d1d5db;padding:10px}
      th{text-align:left;background:#f9fafb}
      .totals{margin-top:18px;width:280px;margin-left:auto;font-size:14px}
      .totals div{display:flex;justify-content:space-between;padding:4px 0}
      .total{border-top:1px solid #111827;margin-top:6px;padding-top:8px;font-size:16px;font-weight:700}
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="header">
        <img class="logo" src="${logoSrc}" alt="Finishing Touch" />
        <div class="meta">
          <div class="number">${invoice.number}</div>
          <div class="date">Invoice date: ${createdDate}</div>
        </div>
      </div>
      <div class="customer">
        <div><strong>${invoice.customerName}</strong></div>
        <div>${invoice.customerJobAddress}</div>
        <div>${invoice.customerPhone}</div>
        <div>${invoice.customerEmail}</div>
      </div>
      <table>
        <thead>
          <tr><th>Description</th><th>Qty</th><th>Price</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="totals">
        <div><span>Subtotal</span><span>${invoice.currencySymbol}${Number(invoice.subtotal).toLocaleString('en-US')}</span></div>
        <div><span>Tax</span><span>${invoice.currencySymbol}${Number(invoice.tax).toLocaleString('en-US')}</span></div>
        <div class="total"><span>Total</span><span>${invoice.currencySymbol}${Number(invoice.total).toLocaleString('en-US')}</span></div>
      </div>
    </div>
  </body>
</html>`;
};

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();

  try {
    const url = new URL(endpoint, 'http://localhost');
    const path = url.pathname;

    if (path === '/leads' && method === 'POST') {
      return (await createLead(options.body, options.token)) as T;
    }

    if (path === '/estimates' && method === 'GET') {
      return (await listEstimates(
        url.searchParams.get('search') || '',
        url.searchParams.get('status') || '',
        options.token,
      )) as T;
    }

    if (path === '/estimates' && method === 'POST') {
      return (await createEstimate(options.body, options.token)) as T;
    }

    const estimateDetailMatch = path.match(/^\/estimates\/([^/]+)$/);
    if (estimateDetailMatch && method === 'GET') {
      return (await getEstimate(estimateDetailMatch[1], options.token)) as T;
    }
    if (estimateDetailMatch && method === 'PATCH') {
      return (await updateEstimate(estimateDetailMatch[1], options.body, options.token)) as T;
    }
    if (estimateDetailMatch && method === 'DELETE') {
      return (await deleteEstimate(estimateDetailMatch[1], options.token)) as T;
    }

    const estimateSendMatch = path.match(/^\/estimates\/([^/]+)\/send$/);
    if (estimateSendMatch && method === 'POST') {
      return (await sendEstimate(estimateSendMatch[1], options.token)) as T;
    }

    const convertMatch = path.match(/^\/estimates\/([^/]+)\/convert-to-invoice$/);
    if (convertMatch && method === 'POST') {
      return (await convertEstimateToInvoice(convertMatch[1], options.token)) as T;
    }

    if (path === '/invoices' && method === 'GET') {
      return (await listInvoices(
        url.searchParams.get('search') || '',
        url.searchParams.get('status') || '',
        options.token,
      )) as T;
    }

    const invoiceMatch = path.match(/^\/invoices\/([^/]+)$/);
    if (invoiceMatch && method === 'GET') {
      return (await getInvoice(invoiceMatch[1], options.token)) as T;
    }
    if (invoiceMatch && method === 'PATCH') {
      return (await updateInvoice(invoiceMatch[1], options.body, options.token)) as T;
    }
    if (invoiceMatch && method === 'DELETE') {
      return (await deleteInvoice(invoiceMatch[1], options.token)) as T;
    }

    if (path === '/employees' && method === 'GET') {
      return (await listEmployees(options.token)) as T;
    }
    if (path === '/employees' && method === 'POST') {
      return (await createEmployee(options.body, options.token)) as T;
    }

    const employeeMatch = path.match(/^\/employees\/([^/]+)$/);
    if (employeeMatch && method === 'PATCH') {
      return (await updateEmployee(employeeMatch[1], options.body, options.token)) as T;
    }
    if (employeeMatch && method === 'DELETE') {
      return (await deleteEmployee(employeeMatch[1], options.token)) as T;
    }

    const timesheetMatch = path.match(/^\/employees\/([^/]+)\/timesheets$/);
    if (timesheetMatch && method === 'GET') {
      return (await getTimesheets(
        timesheetMatch[1],
        url.searchParams.get('from') || '',
        url.searchParams.get('to') || '',
        options.token,
      )) as T;
    }

    if (path === '/time-entries' && method === 'GET') {
      return (await listTimeEntries(url.searchParams, options.token)) as T;
    }

    if (path === '/time-entries/punch' && method === 'POST') {
      return (await punchClock(options.body, options.token)) as T;
    }

    if (path === '/time-entries/clocked-in/employees' && method === 'GET') {
      return (await listClockedIn(options.token)) as T;
    }

    if (path === '/jobs' && method === 'GET') {
      return (await listJobs(url.searchParams, options.token)) as T;
    }

    if (path === '/jobs' && method === 'POST') {
      return (await createJob(options.body, options.token)) as T;
    }

    const createFromEstimateMatch = path.match(/^\/jobs\/from-estimate\/([^/]+)$/);
    if (createFromEstimateMatch && method === 'POST') {
      return (await createJobFromEstimate(
        createFromEstimateMatch[1],
        options.body,
        options.token,
      )) as T;
    }

    throw new Error(`Unsupported endpoint ${method} ${path}`);
  } catch (error) {
    throw new Error(errorMessage(error));
  }
}

export async function apiPdf(endpoint: string, token: string): Promise<Blob> {
  const estimateMatch = endpoint.match(/^\/estimates\/([^/]+)\/pdf$/);
  if (estimateMatch) {
    const estimate = await apiRequest<Awaited<ReturnType<typeof getEstimate>>>(
      `/estimates/${estimateMatch[1]}`,
      { token },
    );
    return new Blob([estimatePrintHtml(estimate)], { type: 'text/html' });
  }

  const invoiceMatch = endpoint.match(/^\/invoices\/([^/]+)\/pdf$/);
  if (invoiceMatch) {
    const invoice = await apiRequest<Awaited<ReturnType<typeof getInvoice>>>(
      `/invoices/${invoiceMatch[1]}`,
      { token },
    );
    return new Blob([invoicePrintHtml(invoice)], { type: 'text/html' });
  }

  throw new Error('Unsupported PDF endpoint');
}
