import fetchProgress from "fetch-progress"
import { Server } from "swarpc"
import { procedures } from "./lib/procedures"

// 1. Give yourself a server instance
const swarpc = Server(procedures)

// 2. Implement your procedures
swarpc.getClassmapping(async ({ ref }, onProgress) => {
  return fetch(
    `https://raw.githubusercontent.com/cigaleapp/models/${ref}/polymny-17k-classmapping.txt`
  )
    .then(fetchProgress({ onProgress }))
    .then((response) => response.text())
    .then((text) => text.split("\n"))
})

// Start the server
swarpc.start(self)
