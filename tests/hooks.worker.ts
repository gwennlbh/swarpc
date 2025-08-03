import { Server } from "../src/index.js"
import { procedures } from "./hooks.procedures.js"

declare const self: Worker

const server = Server(procedures, { worker: self })
server.echo(async ({ value }) => value)
server.add(async ({ a, b }) => a + b)
server.divide(async ({ a, b }, onProgress) => {
  for (let i = 1; i <= 3; i++) {
    await new Promise((r) => setTimeout(r, 10))
    onProgress({ percent: Math.floor((i / 3) * 100) })
  }
  if (b === 0) throw new Error("Division by zero")
  return a / b
})

server.start(self)
