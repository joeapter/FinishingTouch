import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Estimate creation (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates an estimate with admin credentials', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'admin@finishingtouch.test',
        password: 'Password123!',
      })
      .expect(201);

    const token = loginResponse.body.accessToken as string;

    expect(token).toBeTruthy();

    const createResponse = await request(app.getHttpServer())
      .post('/api/estimates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customer: {
          name: 'E2E Customer',
          jobAddress: '1 Test Street',
          phone: '555-7777',
          email: 'e2e@example.com',
        },
        movingDate: new Date(Date.now() + 86400000).toISOString(),
        rooms: {
          kitchenQty: 1,
          diningRoomQty: 0,
          livingRoomQty: 1,
          bathroomsQty: 1,
          masterBathroomsQty: 0,
          bedrooms: [{ beds: 1 }, { beds: 3 }],
        },
      })
      .expect(201);

    expect(createResponse.body).toMatchObject({
      number: expect.stringMatching(/^EST-\d{6}$/),
      customerName: 'E2E Customer',
      subtotal: expect.any(Number),
      total: expect.any(Number),
    });
  });
});
