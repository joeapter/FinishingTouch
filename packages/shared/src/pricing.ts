export const ROOM_PRICES = {
  kitchen: 1000,
  diningRoom: 2000,
  livingRoom: 2000,
  bathroom: 500,
  masterBathroom: 750,
} as const;

export type BedroomConfig = {
  beds: number;
};

export type EstimateRoomsInput = {
  kitchenQty: number;
  diningRoomQty: number;
  livingRoomQty: number;
  bathroomsQty: number;
  masterBathroomsQty: number;
  bedrooms: BedroomConfig[];
};

export type PricingLineItem = {
  key:
    | 'kitchen'
    | 'diningRoom'
    | 'livingRoom'
    | 'bedrooms'
    | 'bathrooms'
    | 'masterBathrooms';
  description: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  metadata?: Record<string, unknown>;
};

export type PricingSummary = {
  lineItems: PricingLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  bedroomsTotal: number;
  bedroomCount: number;
};

export const calculateBedroomPrice = (beds: number): number => {
  if (beds <= 2) {
    return 1000;
  }

  return 1000 + (beds - 2) * 500;
};

export const normalizeNonNegative = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
};

export const calculateEstimatePricing = (
  input: EstimateRoomsInput,
  tax: number = 0,
): PricingSummary => {
  const kitchenQty = normalizeNonNegative(input.kitchenQty);
  const diningRoomQty = normalizeNonNegative(input.diningRoomQty);
  const livingRoomQty = normalizeNonNegative(input.livingRoomQty);
  const bathroomsQty = normalizeNonNegative(input.bathroomsQty);
  const masterBathroomsQty = normalizeNonNegative(input.masterBathroomsQty);

  const bedrooms = input.bedrooms.map((bedroom) => ({
    beds: Math.min(6, Math.max(1, Math.floor(bedroom.beds || 1))),
  }));

  const bedroomsTotal = bedrooms.reduce(
    (sum, bedroom) => sum + calculateBedroomPrice(bedroom.beds),
    0,
  );

  const bedroomCount = bedrooms.length;
  const bedsSummary = bedrooms.map((bedroom) => bedroom.beds).join(',');

  const lineItems: PricingLineItem[] = [
    {
      key: 'kitchen',
      description: 'Kitchen',
      qty: kitchenQty,
      unitPrice: ROOM_PRICES.kitchen,
      totalPrice: kitchenQty * ROOM_PRICES.kitchen,
    },
    {
      key: 'diningRoom',
      description: 'Dining Room',
      qty: diningRoomQty,
      unitPrice: ROOM_PRICES.diningRoom,
      totalPrice: diningRoomQty * ROOM_PRICES.diningRoom,
    },
    {
      key: 'livingRoom',
      description: 'Living Room',
      qty: livingRoomQty,
      unitPrice: ROOM_PRICES.livingRoom,
      totalPrice: livingRoomQty * ROOM_PRICES.livingRoom,
    },
    {
      key: 'bedrooms',
      description: `Bedrooms (beds: ${bedsSummary || 'none'})`,
      qty: bedroomCount,
      unitPrice: 0,
      totalPrice: bedroomsTotal,
      metadata: {
        beds: bedrooms.map((bedroom) => bedroom.beds),
      },
    },
    {
      key: 'bathrooms',
      description: 'Bathrooms',
      qty: bathroomsQty,
      unitPrice: ROOM_PRICES.bathroom,
      totalPrice: bathroomsQty * ROOM_PRICES.bathroom,
    },
    {
      key: 'masterBathrooms',
      description: 'Master Bathrooms',
      qty: masterBathroomsQty,
      unitPrice: ROOM_PRICES.masterBathroom,
      totalPrice: masterBathroomsQty * ROOM_PRICES.masterBathroom,
    },
  ];

  const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const total = subtotal + tax;

  return {
    lineItems,
    subtotal,
    tax,
    total,
    bedroomsTotal,
    bedroomCount,
  };
};
