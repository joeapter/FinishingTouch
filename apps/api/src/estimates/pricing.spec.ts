import {
  calculateBedroomPrice,
  calculateEstimatePricing,
} from '@finishing-touch/shared';

describe('Estimate pricing engine', () => {
  it('calculates bedroom price for up to 2 beds as base 100', () => {
    expect(calculateBedroomPrice(1)).toBe(100);
    expect(calculateBedroomPrice(2)).toBe(100);
  });

  it('adds 500 per bed beyond 2', () => {
    // beds=4 => 100 + (2 * 500) = 1100
    expect(calculateBedroomPrice(4)).toBe(1100);
    expect(calculateBedroomPrice(6)).toBe(2100);
  });

  it('computes full estimate totals and bedroom summary', () => {
    const result = calculateEstimatePricing({
      kitchenQty: 1,
      diningRoomQty: 1,
      livingRoomQty: 1,
      bathroomsQty: 2,
      masterBathroomsQty: 1,
      bedrooms: [{ beds: 1 }, { beds: 4 }],
    });

    expect(result.bedroomCount).toBe(2);
    expect(result.bedroomsTotal).toBe(1200);
    expect(result.subtotal).toBe(7950);
    expect(result.tax).toBe(0);
    expect(result.total).toBe(7950);

    const bedroomLine = result.lineItems.find(
      (item) => item.key === 'bedrooms',
    );
    expect(bedroomLine?.description).toBe('Bedrooms (beds: 1,4)');
    expect(bedroomLine?.qty).toBe(2);
    expect(bedroomLine?.totalPrice).toBe(1200);
  });

  it('clamps invalid values and keeps non-negative quantities', () => {
    const result = calculateEstimatePricing({
      kitchenQty: -5,
      diningRoomQty: -1,
      livingRoomQty: 0,
      bathroomsQty: -3,
      masterBathroomsQty: 0,
      bedrooms: [{ beds: 0 }, { beds: 9 }],
    });

    expect(result.lineItems.find((item) => item.key === 'kitchen')?.qty).toBe(
      0,
    );
    expect(
      result.lineItems.find((item) => item.key === 'diningRoom')?.qty,
    ).toBe(0);
    expect(
      result.lineItems.find((item) => item.key === 'bedrooms')?.description,
    ).toBe('Bedrooms (beds: 1,6)');
    expect(result.total).toBe(2200);
  });
});
