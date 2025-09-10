import type { ProceduresMap } from "swarpc";
import { type } from "arktype";

/**
 * Shared procedures that can be used by both service workers and dedicated workers.
 * These procedures implement simple math operations with progress reporting and cancellation support.
 */
export const sharedProcedures = {
  // Calculates factorial with progress updates
  calculateFactorial: {
    input: type({
      number: type("number").describe(
        "Number to calculate factorial for (max 20)",
      ),
      delay: type("number")
        .describe("Delay in ms between each step")
        .default(100),
    }),
    progress: type({
      step: "number",
      total: "number",
      currentValue: "string",
      percentage: "number",
    }),
    success: type({
      result: "string",
      steps: "number",
      inputNumber: "number",
    }),
  },

  // Calculates sum of squares with artificial delay
  calculateSumOfSquares: {
    input: type({
      count: type("number").describe("How many numbers to sum squares for"),
      delay: type("number")
        .describe("Delay in ms between each calculation")
        .default(50),
    }),
    progress: type({
      current: "number",
      total: "number",
      runningSum: "number",
      percentage: "number",
    }),
    success: type({
      result: "number",
      count: "number",
      formula: "string",
    }),
  },

  // Calculates Fibonacci sequence
  calculateFibonacci: {
    input: type({
      terms: type("number").describe("Number of Fibonacci terms to calculate"),
      delay: type("number")
        .describe("Delay in ms between each term")
        .default(75),
    }),
    progress: type({
      term: "number",
      total: "number",
      currentValue: "string",
      sequence: "string[]",
      percentage: "number",
    }),
    success: type({
      sequence: "string[]",
      lastValue: "string",
      terms: "number",
    }),
  },
} as const satisfies ProceduresMap;
