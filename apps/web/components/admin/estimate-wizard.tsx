'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { calculateEstimatePricing } from '@finishing-touch/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/api-client';
import { CURRENCY_SYMBOL } from '@/lib/env';

type FormValues = z.infer<typeof wizardSchema>;

const wizardSchema = z.object({
  customer: z.object({
    name: z.string().min(2),
    jobAddress: z.string().min(3),
    phone: z.string().min(6),
    email: z.string().email(),
  }),
  movingDate: z.string().min(1),
  notes: z.string().optional(),
  rooms: z.object({
    kitchenQty: z.number().int().min(0),
    diningRoomQty: z.number().int().min(0),
    livingRoomQty: z.number().int().min(0),
    bathroomsQty: z.number().int().min(0),
    masterBathroomsQty: z.number().int().min(0),
    bedroomCount: z.number().int().min(0),
    bedrooms: z.array(
      z.object({
        beds: z.number().int().min(1).max(6),
      }),
    ),
  }),
});

const steps = ['Customer', 'Rooms', 'Review'];

function money(value: number) {
  return `${CURRENCY_SYMBOL}${value.toLocaleString()}`;
}

export function EstimateWizard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      customer: {
        name: '',
        jobAddress: '',
        phone: '',
        email: '',
      },
      movingDate: '',
      notes: '',
      rooms: {
        kitchenQty: 0,
        diningRoomQty: 0,
        livingRoomQty: 0,
        bathroomsQty: 0,
        masterBathroomsQty: 0,
        bedroomCount: 0,
        bedrooms: [],
      },
    },
  });

  const bedroomsArray = useFieldArray({
    control: form.control,
    name: 'rooms.bedrooms',
  });
  const { append, remove, fields } = bedroomsArray;

  const bedroomCount = form.watch('rooms.bedroomCount');

  useEffect(() => {
    const desiredCount = Math.max(0, Number.isFinite(bedroomCount) ? bedroomCount : 0);
    const currentValues = form.getValues('rooms.bedrooms');

    if (desiredCount > currentValues.length) {
      const toAdd = desiredCount - currentValues.length;
      for (let i = 0; i < toAdd; i += 1) {
        append({ beds: 1 });
      }
      return;
    }

    if (desiredCount < currentValues.length) {
      for (let i = currentValues.length; i > desiredCount; i -= 1) {
        remove(i - 1);
      }
    }
  }, [append, bedroomCount, form, remove]);

  const watchedRooms = form.watch('rooms');

  const pricing = useMemo(() => {
    return calculateEstimatePricing({
      kitchenQty: watchedRooms.kitchenQty,
      diningRoomQty: watchedRooms.diningRoomQty,
      livingRoomQty: watchedRooms.livingRoomQty,
      bathroomsQty: watchedRooms.bathroomsQty,
      masterBathroomsQty: watchedRooms.masterBathroomsQty,
      bedrooms: watchedRooms.bedrooms,
    });
  }, [watchedRooms]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!session?.accessToken) {
        throw new Error('Missing session token');
      }

      return apiRequest<{ id: string }>('/estimates', {
        method: 'POST',
        token: session.accessToken,
        body: {
          customer: values.customer,
          movingDate: values.movingDate,
          notes: values.notes,
          rooms: {
            kitchenQty: values.rooms.kitchenQty,
            diningRoomQty: values.rooms.diningRoomQty,
            livingRoomQty: values.rooms.livingRoomQty,
            bathroomsQty: values.rooms.bathroomsQty,
            masterBathroomsQty: values.rooms.masterBathroomsQty,
            bedrooms: values.rooms.bedrooms,
          },
        },
      });
    },
    onSuccess: (createdEstimate) => {
      router.push(`/admin/estimates/${createdEstimate.id}`);
    },
  });

  const nextStep = async () => {
    if (step === 0) {
      const valid = await form.trigger([
        'customer.name',
        'customer.jobAddress',
        'customer.phone',
        'customer.email',
        'movingDate',
      ]);

      if (!valid) {
        return;
      }
    }

    if (step === 1) {
      const valid = await form.trigger([
        'rooms.kitchenQty',
        'rooms.diningRoomQty',
        'rooms.livingRoomQty',
        'rooms.bathroomsQty',
        'rooms.masterBathroomsQty',
        'rooms.bedroomCount',
        'rooms.bedrooms',
      ]);

      if (!valid) {
        return;
      }
    }

    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader>
          <div className="flex gap-2">
            {steps.map((item, index) => (
              <div
                key={item}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  index <= step
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {item}
              </div>
            ))}
          </div>
          <CardTitle>Create Estimate</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
            {step === 0 ? <CustomerStep form={form} /> : null}
            {step === 1 ? <RoomsStep form={form} fields={fields.length} /> : null}
            {step === 2 ? <ReviewStep form={form} pricing={pricing} /> : null}

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((current) => Math.max(current - 1, 0))}
                disabled={step === 0}
              >
                Back
              </Button>
              {step < steps.length - 1 ? (
                <Button type="button" onClick={nextStep}>
                  Continue
                </Button>
              ) : (
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Creating...' : 'Create Estimate'}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="h-fit lg:sticky lg:top-24">
        <CardHeader>
          <CardTitle>Instant Price Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {pricing.lineItems.map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <span className="text-slate-600">{item.description}</span>
              <span className="font-medium text-slate-900">{money(item.totalPrice)}</span>
            </div>
          ))}
          <div className="mt-4 border-t border-slate-200 pt-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium">{money(pricing.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span className="font-medium">{money(pricing.tax)}</span>
            </div>
            <div className="mt-2 flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{money(pricing.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CustomerStep({
  form,
}: {
  form: ReturnType<typeof useForm<FormValues>>;
}) {
  return (
    <div className="grid gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="customer-name">Customer Name</Label>
        <Input id="customer-name" {...form.register('customer.name')} className="h-12" />
        <ErrorText message={form.formState.errors.customer?.name?.message} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="job-address">Job Address</Label>
        <Input id="job-address" {...form.register('customer.jobAddress')} className="h-12" />
        <ErrorText message={form.formState.errors.customer?.jobAddress?.message} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="customer-phone">Phone</Label>
          <Input id="customer-phone" {...form.register('customer.phone')} className="h-12" />
          <ErrorText message={form.formState.errors.customer?.phone?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="customer-email">Email</Label>
          <Input id="customer-email" type="email" {...form.register('customer.email')} className="h-12" />
          <ErrorText message={form.formState.errors.customer?.email?.message} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="moving-date">Moving Date</Label>
        <Input id="moving-date" type="date" {...form.register('movingDate')} className="h-12" />
        <ErrorText message={form.formState.errors.movingDate?.message} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Input id="notes" {...form.register('notes')} className="h-12" />
      </div>
    </div>
  );
}

function RoomsStep({
  form,
  fields,
}: {
  form: ReturnType<typeof useForm<FormValues>>;
  fields: number;
}) {
  return (
    <div className="grid gap-4">
      <RoomQtyInput form={form} name="rooms.kitchenQty" label="Kitchen Qty" />
      <RoomQtyInput form={form} name="rooms.diningRoomQty" label="Dining Room Qty" />
      <RoomQtyInput form={form} name="rooms.livingRoomQty" label="Living Room Qty" />
      <RoomQtyInput form={form} name="rooms.bathroomsQty" label="Bathrooms Qty" />
      <RoomQtyInput
        form={form}
        name="rooms.masterBathroomsQty"
        label="Master Bathrooms Qty"
      />

      <RoomQtyInput form={form} name="rooms.bedroomCount" label="Bedroom Count" />

      {fields > 0 ? (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-700">Beds per bedroom</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: fields }).map((_, index) => (
              <div key={index} className="space-y-1.5">
                <Label htmlFor={`bedroom-beds-${index}`}>Bedroom {index + 1} beds</Label>
                <Input
                  id={`bedroom-beds-${index}`}
                  type="number"
                  min={1}
                  max={6}
                  {...form.register(`rooms.bedrooms.${index}.beds`, {
                    valueAsNumber: true,
                  })}
                  className="h-12"
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ReviewStep({
  form,
  pricing,
}: {
  form: ReturnType<typeof useForm<FormValues>>;
  pricing: ReturnType<typeof calculateEstimatePricing>;
}) {
  const values = form.getValues();

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-slate-700">Customer</h3>
        <p className="mt-1 text-sm text-slate-600">{values.customer.name}</p>
        <p className="text-sm text-slate-600">{values.customer.jobAddress}</p>
        <p className="text-sm text-slate-600">{values.customer.phone}</p>
        <p className="text-sm text-slate-600">{values.customer.email}</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-700">Moving date</h3>
        <p className="mt-1 text-sm text-slate-600">{values.movingDate}</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-700">Line items</h3>
        <ul className="mt-2 space-y-2 text-sm text-slate-600">
          {pricing.lineItems.map((item) => (
            <li key={item.key} className="flex justify-between rounded-md bg-slate-50 px-3 py-2">
              <span>{item.description}</span>
              <span>{money(item.totalPrice)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RoomQtyInput({
  form,
  name,
  label,
}: {
  form: ReturnType<typeof useForm<FormValues>>;
  name:
    | 'rooms.kitchenQty'
    | 'rooms.diningRoomQty'
    | 'rooms.livingRoomQty'
    | 'rooms.bathroomsQty'
    | 'rooms.masterBathroomsQty'
    | 'rooms.bedroomCount';
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type="number"
        min={0}
        {...form.register(name, {
          valueAsNumber: true,
        })}
        className="h-12"
      />
    </div>
  );
}

function ErrorText({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-red-600">{message}</p>;
}
