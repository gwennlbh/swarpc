// Service Worker implementation for swarpc testing
console.log('Service worker loading...');

// Import arktype and shared procedures
importScripts('https://unpkg.com/arktype@2.0.0-rc.18/dist/index.global.js');
importScripts('./shared-procedures.js');

// Import swarpc from unpkg for now (in a real app, you'd bundle this)
importScripts('https://unpkg.com/swarpc@latest/dist/index.js');

console.log('Service worker imports loaded');

const CACHE_NAME = 'swarpc-v1';

self.addEventListener('install', (event) => {
  console.log('Service worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activating...');
  event.waitUntil(self.clients.claim());
});

// Initialize swarpc server
const swarpcServer = swarpc.Server(self.sharedProcedures);

// Implement shared procedures
swarpcServer.calculateFactorial(async ({ number, delay }, onProgress, tools) => {
  tools.abortSignal?.throwIfAborted();

  // Validate input  
  if (number < 0)
    throw new Error("Cannot calculate factorial of negative number");
  if (number > 20)
    throw new Error("Number too large (max 20 to prevent overflow)");

  let result = 1n; // Use BigInt for large factorials
  const total = Math.floor(number);

  for (let i = 1; i <= total; i++) {
    tools.abortSignal?.throwIfAborted();

    result *= BigInt(i);
    const percentage = (i / total) * 100;

    onProgress({
      step: i,
      total,
      currentValue: result.toString(),
      percentage,
    });

    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return {
    result: result.toString(),
    steps: total,
    inputNumber: number,
  };
});

swarpcServer.calculateSumOfSquares(async ({ count, delay }, onProgress, tools) => {
  tools.abortSignal?.throwIfAborted();

  if (count < 1) throw new Error("Count must be at least 1");
  if (count > 1000) throw new Error("Count too large (max 1000)");

  let sum = 0;

  for (let i = 1; i <= count; i++) {
    tools.abortSignal?.throwIfAborted();

    sum += i * i;
    const percentage = (i / count) * 100;

    onProgress({
      current: i,
      total: count,
      runningSum: sum,
      percentage,
    });

    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return {
    result: sum,
    count,
    formula: `1² + 2² + ... + ${count}² = ${sum}`,
  };
});

swarpcServer.calculateFibonacci(async ({ terms, delay }, onProgress, tools) => {
  tools.abortSignal?.throwIfAborted();

  if (terms < 1) throw new Error("Terms must be at least 1");
  if (terms > 100) throw new Error("Too many terms (max 100)");

  const sequence = [];
  let a = 0n,
    b = 1n;

  for (let i = 0; i < terms; i++) {
    tools.abortSignal?.throwIfAborted();

    if (i === 0) {
      sequence.push(a.toString());
    } else if (i === 1) {
      sequence.push(b.toString());
    } else {
      const next = a + b;
      sequence.push(next.toString());
      a = b;
      b = next;
    }

    const percentage = ((i + 1) / terms) * 100;

    onProgress({
      term: i + 1,
      total: terms,
      currentValue: sequence[i],
      sequence: [...sequence],
      percentage,
    });

    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return {
    sequence,
    lastValue: sequence[sequence.length - 1],
    terms,
  };
});

// Start the server
console.log('Starting swarpc server in service worker...');
swarpcServer.start(self);
console.log('Service worker ready!');