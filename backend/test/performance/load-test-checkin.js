import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 }, // ramp up to 100 users
    { duration: '1m', target: 100 },  // stay at 100 users
    { duration: '30s', target: 0 },   // ramp down
  ],
};

const tokens = [
  'tkt-perf-1-1774280024',
  'tkt-perf-2-1774280024',
  'tkt-perf-3-1774280024',
  'tkt-perf-4-1774280025',
  'tkt-perf-5-1774280025',
  'tkt-perf-6-1774280026',
  'tkt-perf-7-1774280026',
  'tkt-perf-8-1774280026',
  'tkt-perf-9-1774280027',
  'tkt-perf-10-1774280027'
];

export default function () {
  const url = 'http://localhost:3333/checkin/process'; // Confirmar endpoint real de checkin
  const token = tokens[Math.floor(Math.random() * tokens.length)];
  
  const payload = JSON.stringify({
    qrCodeToken: token,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);
  check(res, {
    'status is 201 or 200': (r) => r.status === 201 || r.status === 200,
    'scan time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(0.5);
}
