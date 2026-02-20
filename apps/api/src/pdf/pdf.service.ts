import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';
import { formatCurrency } from '../common/currency';

type DocumentLineItem = {
  description: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
};

type EstimatePdfData = {
  number: string;
  movingDate: Date;
  customerName: string;
  customerJobAddress: string;
  customerPhone: string;
  customerEmail: string;
  currencySymbol: string;
  subtotal: number;
  tax: number;
  total: number;
  lineItems: DocumentLineItem[];
};

type InvoicePdfData = {
  number: string;
  createdAt: Date;
  customerName: string;
  customerJobAddress: string;
  customerPhone: string;
  customerEmail: string;
  currencySymbol: string;
  subtotal: number;
  tax: number;
  total: number;
  lineItems: DocumentLineItem[];
};

@Injectable()
export class PdfService {
  constructor(private readonly configService: ConfigService) {}

  private async resolveLogoDataUri(): Promise<string> {
    const candidatePaths = [
      path.resolve(process.cwd(), 'assets/logo.png'),
      path.resolve(process.cwd(), '../assets/logo.png'),
      path.resolve(process.cwd(), '../../assets/logo.png'),
      path.resolve(process.cwd(), 'apps/web/public/logo-placeholder.png'),
      path.resolve(process.cwd(), '../web/public/logo-placeholder.png'),
    ];

    const logoPath = candidatePaths.find((candidate) => existsSync(candidate));

    if (!logoPath) {
      return '';
    }

    const imageBuffer = await readFile(logoPath);
    return `data:image/png;base64,${imageBuffer.toString('base64')}`;
  }

  private baseStyles() {
    return `
      <style>
        body {
          margin: 0;
          padding: 30px;
          font-family: Arial, Helvetica, sans-serif;
          color: #1f2937;
        }

        .sheet {
          border: 1px solid #d1d5db;
          padding: 24px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .logo {
          width: 150px;
          height: auto;
          object-fit: contain;
        }

        .meta {
          text-align: right;
        }

        .number {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .date {
          font-size: 14px;
          color: #4b5563;
        }

        .customer {
          margin-top: 20px;
          margin-left: 25px;
          line-height: 1.6;
          font-size: 14px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 22px;
          font-size: 14px;
        }

        th,
        td {
          border: 1px solid #d1d5db;
          padding: 10px;
        }

        th {
          text-align: left;
          background: #f9fafb;
        }

        td:nth-child(2),
        td:nth-child(3) {
          text-align: right;
        }

        .totals {
          margin-top: 18px;
          width: 100%;
          display: flex;
          justify-content: flex-end;
        }

        .totals-table {
          width: 280px;
          border-collapse: collapse;
        }

        .totals-table td {
          border: none;
          padding: 6px 0;
          font-size: 14px;
        }

        .totals-table td:last-child {
          text-align: right;
          font-weight: 600;
        }

        .totals-table .grand td {
          border-top: 1px solid #111827;
          padding-top: 8px;
          font-size: 16px;
          font-weight: 700;
        }
      </style>
    `;
  }

  private renderRows(lineItems: DocumentLineItem[], symbol: string): string {
    return lineItems
      .map(
        (item) => `
          <tr>
            <td>${item.description}</td>
            <td>${item.qty}</td>
            <td>${formatCurrency(item.totalPrice, symbol)}</td>
          </tr>
        `,
      )
      .join('');
  }

  private renderEstimateHtml(data: EstimatePdfData, logoSrc: string): string {
    const movingDate = new Date(data.movingDate).toLocaleDateString('en-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${data.number}</title>
          ${this.baseStyles()}
        </head>
        <body>
          <div class="sheet">
            <div class="header">
              <img class="logo" src="${logoSrc}" alt="Finishing Touch Logo" />
              <div class="meta">
                <div class="number">${data.number}</div>
                <div class="date">Moving date: ${movingDate}</div>
              </div>
            </div>

            <div class="customer">
              <div><strong>${data.customerName}</strong></div>
              <div>${data.customerJobAddress}</div>
              <div>${data.customerPhone}</div>
              <div>${data.customerEmail}</div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                ${this.renderRows(data.lineItems, data.currencySymbol)}
              </tbody>
            </table>

            <div class="totals">
              <table class="totals-table">
                <tr>
                  <td>Subtotal</td>
                  <td>${formatCurrency(data.subtotal, data.currencySymbol)}</td>
                </tr>
                <tr>
                  <td>Tax</td>
                  <td>${formatCurrency(data.tax, data.currencySymbol)}</td>
                </tr>
                <tr class="grand">
                  <td>Total</td>
                  <td>${formatCurrency(data.total, data.currencySymbol)}</td>
                </tr>
              </table>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private renderInvoiceHtml(data: InvoicePdfData, logoSrc: string): string {
    const invoiceDate = new Date(data.createdAt).toLocaleDateString('en-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${data.number}</title>
          ${this.baseStyles()}
        </head>
        <body>
          <div class="sheet">
            <div class="header">
              <img class="logo" src="${logoSrc}" alt="Finishing Touch Logo" />
              <div class="meta">
                <div class="number">${data.number}</div>
                <div class="date">Invoice date: ${invoiceDate}</div>
              </div>
            </div>

            <div class="customer">
              <div><strong>${data.customerName}</strong></div>
              <div>${data.customerJobAddress}</div>
              <div>${data.customerPhone}</div>
              <div>${data.customerEmail}</div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                ${this.renderRows(data.lineItems, data.currencySymbol)}
              </tbody>
            </table>

            <div class="totals">
              <table class="totals-table">
                <tr>
                  <td>Subtotal</td>
                  <td>${formatCurrency(data.subtotal, data.currencySymbol)}</td>
                </tr>
                <tr>
                  <td>Tax</td>
                  <td>${formatCurrency(data.tax, data.currencySymbol)}</td>
                </tr>
                <tr class="grand">
                  <td>Total</td>
                  <td>${formatCurrency(data.total, data.currencySymbol)}</td>
                </tr>
              </table>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private async renderPdf(html: string): Promise<Buffer> {
    const executablePath = this.configService.get<string>(
      'PUPPETEER_EXECUTABLE_PATH',
    );

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: executablePath || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      return Buffer.from(
        await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '10px',
            right: '10px',
            bottom: '10px',
            left: '10px',
          },
        }),
      );
    } finally {
      await browser.close();
    }
  }

  async generateEstimatePdf(data: EstimatePdfData): Promise<Buffer> {
    const logoSrc = await this.resolveLogoDataUri();
    const html = this.renderEstimateHtml(data, logoSrc);
    return this.renderPdf(html);
  }

  async generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
    const logoSrc = await this.resolveLogoDataUri();
    const html = this.renderInvoiceHtml(data, logoSrc);
    return this.renderPdf(html);
  }
}
