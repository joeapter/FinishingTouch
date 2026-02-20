import { leadSchema } from '@finishing-touch/shared';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { sendLeadEmails } from '@/lib/email';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const payload = leadSchema.parse(await request.json());
    await sendLeadEmails(payload);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[Email API] lead send failed', error);

    const message =
      error instanceof Error ? error.message : 'Failed to send lead email';

    return NextResponse.json(
      { ok: false, message },
      { status: error instanceof ZodError ? 400 : 500 },
    );
  }
}
