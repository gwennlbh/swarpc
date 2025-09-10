import { Server } from "swarpc";
import { sharedProcedures } from "./lib/shared-procedures";

// 1. Give yourself a server instance
const swarpc = Server(sharedProcedures);

// 2. Implement shared procedures
swarpc.calculateFactorial(async ({ number, delay }, onProgress, tools) => {
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

  const finalResult = {
    result: result.toString(),
    steps: total,
    inputNumber: number,
  };
  return finalResult;
});

swarpc.calculateSumOfSquares(async ({ count, delay }, onProgress, tools) => {
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

  const finalResult = {
    result: sum,
    count,
    formula: `1² + 2² + ... + ${count}² = ${sum}`,
  };
  return finalResult;
});

swarpc.calculateFibonacci(async ({ terms, delay }, onProgress, tools) => {
  tools.abortSignal?.throwIfAborted();

  if (terms < 1) throw new Error("Terms must be at least 1");
  if (terms > 100) throw new Error("Too many terms (max 100)");

  const sequence: string[] = [];
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

  const finalResult = {
    sequence,
    lastValue: sequence[sequence.length - 1],
    terms,
  };
  return finalResult;
});

// Start the server
swarpc.start(self);
