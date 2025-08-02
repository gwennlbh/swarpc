import { Server } from "../src/index.js"
import { procedures } from "./core.procedures.js"

declare const self: Worker

const server = Server(procedures, { worker: self, loglevel: "warn" })
server.hello(async (input) => {
  return `Hello ${input}`
})

server.helloWithProgress(async (input, onProgress) => {
  for (let i = 0; i < 10; i++) {
    onProgress({ current: i, total: 10 })
  }
  return `Hello with progress ${input}`
})

server.cancellable(async (input, onProgress, abortSignal) => {
  let aborted = false
  abortSignal?.addEventListener("abort", () => {
    aborted = true
  })

  for (let i = 0; i < 10; i++) {
    if (aborted) return "cancelled"
    onProgress({ current: i, total: 10 })
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  return `Cancellable hello ${input}`
})

server.complexData(async (input, onProgress) => {
  onProgress({ message: "Processing data", percent: 50 })
  return { message: `Processed data for ${input.name}`, addr: input.address }
})

server.start(self)
