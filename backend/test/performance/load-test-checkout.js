import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 }, // ramp up to 50 users
    { duration: '1m', target: 50 },  // stay at 50 users
    { duration: '30s', target: 0 },  // ramp down
  ],
};

export default function () {
  const eventId = 'cmn3c9zf10007bbuievwvkm5k';
  const baseUrl = 'http://localhost:3333';
  
  // 1. Register a new participant to get a valid userId
  const regPayload = JSON.stringify({
    name: `User ${__VU}-${__ITER}`,
    email: `user-${__VU}-${__ITER}-${Math.floor(Math.random() * 1000000)}@example.com`,
    password: 'password123',
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const regRes = http.post(`${baseUrl}/auth/register-participant`, regPayload, params);
  const authData = regRes.json();
  const token = authData.access_token;
  const user = authData.user;

  if (check(regRes, { 'registered successfully': (r) => r.status === 201 })) {
    // 2. Checkout
    const checkoutPayload = JSON.stringify({
      eventId: eventId,
      activityIds: [],
    });

    const checkoutParams = {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    };

    const checkoutRes = http.post(`${baseUrl}/checkout`, checkoutPayload, checkoutParams);
    check(checkoutRes, {
      'checkout status is 201': (r) => r.status === 201,
      'transaction time < 500ms': (r) => r.timings.duration < 500,
    });
  }

  sleep(1);
}
