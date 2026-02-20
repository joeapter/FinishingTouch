import 'server-only';

import nodemailer from 'nodemailer';

type LeadSource = 'CONTACT' | 'REQUEST_ESTIMATE';

type LeadEmailPayload = {
  name: string;
  email: string;
  phone: string;
  message: string;
  source: LeadSource;
  jobAddress?: string;
  movingDate?: string;
};

type EstimateLineItemPayload = {
  description: string;
  qty: number;
  totalPrice: number;
};

type EstimateEmailPayload = {
  id: string;
  number: string;
  movingDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerJobAddress: string;
  subtotal: number;
  tax: number;
  total: number;
  currencySymbol: string;
  lineItems: EstimateLineItemPayload[];
};

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.migadu.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || '465');
const SMTP_SECURE = (process.env.SMTP_SECURE || 'true').toLowerCase() === 'true';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const EMAIL_FROM = process.env.EMAIL_FROM || SMTP_USER;
const EMAIL_TO = process.env.EMAIL_TO || SMTP_USER;
const EMAIL_SEND_AUTO_REPLY =
  (process.env.EMAIL_SEND_AUTO_REPLY || 'true').toLowerCase() === 'true';

let transporter: nodemailer.Transporter | null = null;

const ensureEmailConfig = () => {
  if (!Number.isFinite(SMTP_PORT) || SMTP_PORT <= 0) {
    throw new Error('Invalid SMTP_PORT env var.');
  }

  if (!SMTP_USER || !SMTP_PASS) {
    throw new Error('Missing SMTP_USER or SMTP_PASS env vars.');
  }

  if (!EMAIL_FROM || !EMAIL_TO) {
    throw new Error('Missing EMAIL_FROM or EMAIL_TO env vars.');
  }
};

const getTransporter = (): nodemailer.Transporter => {
  ensureEmailConfig();

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  return transporter;
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const formatDate = (value?: string): string => {
  if (!value) {
    return 'Not provided';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatMoney = (amount: number, symbol: string): string =>
  `${symbol}${Math.max(0, Math.round(amount)).toLocaleString('en-US')}`;

const sourceLabel = (source: LeadSource): string =>
  source === 'REQUEST_ESTIMATE' ? 'Request Estimate' : 'Contact Form';

export const sendLeadEmails = async (payload: LeadEmailPayload): Promise<void> => {
  const mailer = getTransporter();

  const movingDateText = formatDate(payload.movingDate);
  const subject = `[Finishing Touch] ${sourceLabel(payload.source)}: ${payload.name}`;

  const internalText = [
    `Source: ${sourceLabel(payload.source)}`,
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Phone: ${payload.phone}`,
    `Moving Date: ${movingDateText}`,
    `Job Address: ${payload.jobAddress || 'Not provided'}`,
    '',
    'Message:',
    payload.message,
  ].join('\n');

  const internalHtml = `
    <h2>New ${escapeHtml(sourceLabel(payload.source))}</h2>
    <p><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(payload.phone)}</p>
    <p><strong>Moving Date:</strong> ${escapeHtml(movingDateText)}</p>
    <p><strong>Job Address:</strong> ${escapeHtml(payload.jobAddress || 'Not provided')}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(payload.message).replaceAll('\n', '<br />')}</p>
  `;

  await mailer.sendMail({
    from: EMAIL_FROM,
    to: EMAIL_TO,
    replyTo: payload.email,
    subject,
    text: internalText,
    html: internalHtml,
  });

  if (!EMAIL_SEND_AUTO_REPLY) {
    return;
  }

  await mailer.sendMail({
    from: EMAIL_FROM,
    to: payload.email,
    replyTo: EMAIL_TO,
    subject: 'We received your request | Finishing Touch',
    text: [
      `Hi ${payload.name},`,
      '',
      'Thanks for contacting Finishing Touch. We received your request and will follow up shortly.',
      '',
      `Reference: ${sourceLabel(payload.source)}`,
      '',
      'Finishing Touch',
    ].join('\n'),
    html: `
      <p>Hi ${escapeHtml(payload.name)},</p>
      <p>Thanks for contacting Finishing Touch. We received your request and will follow up shortly.</p>
      <p><strong>Reference:</strong> ${escapeHtml(sourceLabel(payload.source))}</p>
      <p>Finishing Touch</p>
    `,
  });
};

export const sendEstimateEmail = async (
  payload: EstimateEmailPayload,
): Promise<void> => {
  const mailer = getTransporter();
  const movingDateText = formatDate(payload.movingDate);

  const lineItemsText = payload.lineItems
    .map(
      (item) =>
        `- ${item.description} | Qty ${item.qty} | ${formatMoney(item.totalPrice, payload.currencySymbol)}`,
    )
    .join('\n');

  const lineItemsHtml = payload.lineItems
    .map(
      (item) => `
        <tr>
          <td style="border:1px solid #d1d5db;padding:8px">${escapeHtml(item.description)}</td>
          <td style="border:1px solid #d1d5db;padding:8px;text-align:right">${item.qty}</td>
          <td style="border:1px solid #d1d5db;padding:8px;text-align:right">${escapeHtml(
            formatMoney(item.totalPrice, payload.currencySymbol),
          )}</td>
        </tr>
      `,
    )
    .join('');

  await mailer.sendMail({
    from: EMAIL_FROM,
    to: payload.customerEmail,
    bcc: EMAIL_TO,
    replyTo: EMAIL_TO,
    subject: `Your Estimate ${payload.number} | Finishing Touch`,
    text: [
      `Hi ${payload.customerName},`,
      '',
      `Your estimate ${payload.number} is ready.`,
      `Moving Date: ${movingDateText}`,
      '',
      'Line Items:',
      lineItemsText,
      '',
      `Subtotal: ${formatMoney(payload.subtotal, payload.currencySymbol)}`,
      `Tax: ${formatMoney(payload.tax, payload.currencySymbol)}`,
      `Total: ${formatMoney(payload.total, payload.currencySymbol)}`,
      '',
      'Reply to this email if you have questions.',
      '',
      'Finishing Touch',
    ].join('\n'),
    html: `
      <p>Hi ${escapeHtml(payload.customerName)},</p>
      <p>Your estimate <strong>${escapeHtml(payload.number)}</strong> is ready.</p>
      <p><strong>Moving Date:</strong> ${escapeHtml(movingDateText)}</p>
      <table style="width:100%;border-collapse:collapse;margin-top:14px;font-size:14px">
        <thead>
          <tr>
            <th style="border:1px solid #d1d5db;background:#f8fafc;padding:8px;text-align:left">Description</th>
            <th style="border:1px solid #d1d5db;background:#f8fafc;padding:8px;text-align:right">Qty</th>
            <th style="border:1px solid #d1d5db;background:#f8fafc;padding:8px;text-align:right">Price</th>
          </tr>
        </thead>
        <tbody>${lineItemsHtml}</tbody>
      </table>
      <p style="margin-top:14px"><strong>Subtotal:</strong> ${escapeHtml(
        formatMoney(payload.subtotal, payload.currencySymbol),
      )}</p>
      <p><strong>Tax:</strong> ${escapeHtml(formatMoney(payload.tax, payload.currencySymbol))}</p>
      <p><strong>Total:</strong> ${escapeHtml(formatMoney(payload.total, payload.currencySymbol))}</p>
      <p>Reply to this email if you have questions.</p>
      <p>Finishing Touch</p>
    `,
  });
};
