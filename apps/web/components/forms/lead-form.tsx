'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/api-client';

const formSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  message: z.string().min(3),
  source: z.enum(['CONTACT', 'REQUEST_ESTIMATE']),
  jobAddress: z.string().optional(),
  movingDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type LeadFormProps = {
  source: 'CONTACT' | 'REQUEST_ESTIMATE';
  title?: string;
  compact?: boolean;
};

export function LeadForm({ source, title, compact = false }: LeadFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: '',
      source,
      jobAddress: '',
      movingDate: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);

    try {
      await apiRequest('/leads', {
        method: 'POST',
        body: {
          ...values,
          source,
          movingDate: values.movingDate || undefined,
          jobAddress: values.jobAddress || undefined,
        },
      });

      setSubmitted(true);
      form.reset({
        name: '',
        email: '',
        phone: '',
        message: '',
        source,
        jobAddress: '',
        movingDate: '',
      });
    } catch {
      setSubmitError('Could not submit right now. Please try again.');
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {title ? <h3 className="text-xl font-semibold text-slate-900">{title}</h3> : null}
      {submitted ? (
        <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Thanks. Your request was received.
        </p>
      ) : null}
      {submitError ? (
        <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {submitError}
        </p>
      ) : null}

      <form
        className={`mt-4 grid gap-3 ${compact ? 'md:grid-cols-2' : 'md:grid-cols-2'}`}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...form.register('name')} />
          <FormError message={form.formState.errors.name?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...form.register('phone')} />
          <FormError message={form.formState.errors.phone?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...form.register('email')} />
          <FormError message={form.formState.errors.email?.message} />
        </div>

        {source === 'REQUEST_ESTIMATE' ? (
          <div className="space-y-1.5">
            <Label htmlFor="movingDate">Moving Date</Label>
            <Input id="movingDate" type="date" {...form.register('movingDate')} />
          </div>
        ) : null}

        {source === 'REQUEST_ESTIMATE' ? (
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="jobAddress">Job Address</Label>
            <Input id="jobAddress" {...form.register('jobAddress')} />
          </div>
        ) : null}

        <div className="space-y-1.5 md:col-span-2">
          <Label htmlFor="message">Message</Label>
          <Textarea id="message" {...form.register('message')} />
          <FormError message={form.formState.errors.message?.message} />
        </div>

        <input type="hidden" value={source} {...form.register('source')} />

        <div className="md:col-span-2">
          <Button type="submit" className="w-full" size="lg">
            {source === 'CONTACT' ? 'Send Message' : 'Request Estimate'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function FormError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-red-600">{message}</p>;
}
