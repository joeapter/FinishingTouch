import { PrismaClient, Role, EstimateStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { calculateEstimatePricing } from '@finishing-touch/shared';

const prisma = new PrismaClient();

const formatEstimateNumber = (value: number): string =>
  `EST-${String(value).padStart(6, '0')}`;

async function ensureEmployee(data: {
  userId?: string;
  name: string;
  phone: string;
  role: Role;
}) {
  const existing = await prisma.employee.findFirst({
    where: {
      name: data.name,
      phone: data.phone,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.employee.create({
    data,
  });
}

async function ensureEstimate(input: {
  index: number;
  status: EstimateStatus;
  movingDate: Date;
  customer: {
    name: string;
    phone: string;
    email: string;
    jobAddress: string;
  };
  rooms: {
    kitchenQty: number;
    diningRoomQty: number;
    livingRoomQty: number;
    bathroomsQty: number;
    masterBathroomsQty: number;
    bedrooms: Array<{ beds: number }>;
  };
}) {
  const number = formatEstimateNumber(input.index);

  const existing = await prisma.estimate.findUnique({
    where: { number },
  });

  if (existing) {
    return existing;
  }

  const pricing = calculateEstimatePricing(input.rooms);

  return prisma.estimate.create({
    data: {
      number,
      status: input.status,
      movingDate: input.movingDate,
      customerName: input.customer.name,
      customerPhone: input.customer.phone,
      customerEmail: input.customer.email,
      customerJobAddress: input.customer.jobAddress,
      subtotal: pricing.subtotal,
      tax: pricing.tax,
      total: pricing.total,
      currencySymbol: '₪',
      lineItems: {
        create: pricing.lineItems.map((item) => ({
          description: item.description,
          qty: item.qty,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          metadata: item.metadata,
        })),
      },
    },
  });
}

async function main() {
  const adminPasswordHash = await bcrypt.hash('Password123!', 10);

  const adminUser = await prisma.user.upsert({
    where: {
      email: 'admin@finishingtouch.test',
    },
    create: {
      email: 'admin@finishingtouch.test',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
    update: {
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });

  await prisma.employee.upsert({
    where: {
      userId: adminUser.id,
    },
    create: {
      userId: adminUser.id,
      name: 'Alex Admin',
      phone: '555-1000',
      role: Role.ADMIN,
    },
    update: {
      name: 'Alex Admin',
      phone: '555-1000',
      role: Role.ADMIN,
    },
  });

  await ensureEmployee({
    name: 'Maya Painter',
    phone: '555-2000',
    role: Role.EMPLOYEE,
  });
  await ensureEmployee({
    name: 'Daniel Painter',
    phone: '555-3000',
    role: Role.EMPLOYEE,
  });
  await ensureEmployee({
    name: 'Noa Manager',
    phone: '555-4000',
    role: Role.MANAGER,
  });

  await ensureEstimate({
    index: 1,
    status: EstimateStatus.DRAFT,
    movingDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    customer: {
      name: 'Jordan Lee',
      phone: '555-0123',
      email: 'jordan@example.com',
      jobAddress: '12 Ocean Ave, Tel Aviv',
    },
    rooms: {
      kitchenQty: 1,
      diningRoomQty: 1,
      livingRoomQty: 1,
      bathroomsQty: 1,
      masterBathroomsQty: 0,
      bedrooms: [{ beds: 1 }, { beds: 3 }],
    },
  });

  await ensureEstimate({
    index: 2,
    status: EstimateStatus.ACCEPTED,
    movingDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
    customer: {
      name: 'Riley Cohen',
      phone: '555-0456',
      email: 'riley@example.com',
      jobAddress: '48 HaYarkon St, Herzliya',
    },
    rooms: {
      kitchenQty: 1,
      diningRoomQty: 0,
      livingRoomQty: 1,
      bathroomsQty: 2,
      masterBathroomsQty: 1,
      bedrooms: [{ beds: 2 }, { beds: 4 }, { beds: 1 }],
    },
  });

  const leadCount = await prisma.lead.count();
  if (leadCount === 0) {
    await prisma.lead.createMany({
      data: [
        {
          name: 'Taylor Contact',
          email: 'taylor@example.com',
          phone: '555-5000',
          message: 'Need turnover painting for 2BR rental before tenant move-in.',
          source: 'CONTACT',
        },
        {
          name: 'Morgan Request',
          email: 'morgan@example.com',
          phone: '555-6000',
          message: 'Please send estimate for painting an apartment next month.',
          source: 'REQUEST_ESTIMATE',
          jobAddress: '9 Herzl St, Ramat Gan',
        },
      ],
    });
  }

  console.log('Seed completed.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
