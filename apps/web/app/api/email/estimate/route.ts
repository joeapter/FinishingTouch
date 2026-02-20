import { NextResponse } from 'next/server';
import { ZodError, z } from 'zod';
import { auth } from '@/auth';
import { sendEstimateEmail } from '@/lib/email';

const lineItemSchema = z.object({
  description: z.string().min(1),
  qty: z.number().int().min(0),
  totalPrice: z.number().int().min(0),
});

const estimateEmailSchema = z.object({
  id: z.string().min(1),
  number: z.string().min(1),
  movingDate: z.string().min(1),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(1),
  customerJobAddress: z.string().min(1),
  subtotal: z.number().int().min(0),
  tax: z.number().int().min(0),
  total: z.number().int().min(0),
  currencySymbol: z.string().min(1),
  lineItems: z.array(lineItemSchema).min(1),
});

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = estimateEmailSchema.parse(await request.json());
    await sendEstimateEmail(payload);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Email API] estimate send failed', error);

    const message =
      error instanceof Error ? error.message : 'Failed to send estimate email';

    return NextResponse.json(
      { ok: false, message },
      { status: error instanceof ZodError ? 400 : 500 },
    );
  }
}
