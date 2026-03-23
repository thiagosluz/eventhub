import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    tenant_a: {
      executor: 'constant-vus',
      vus: 20,
      duration: '1m',
      exec: 'tenantA',
    },
    tenant_b: {
      executor: 'constant-vus',
      vus: 20,
      duration: '1m',
      exec: 'tenantB',
    },
  },
};

export function tenantA() {
  const res = http.get('http://localhost:3333/events?tenant=tenant-a');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}

export function tenantB() {
  const res = http.get('http://localhost:3333/events?tenant=tenant-b');
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
