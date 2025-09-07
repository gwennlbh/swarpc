export class FauxLocalStorage {
  data: Record<string, any>
  keysOrder: string[]

  constructor(data: Record<string, any>) {
    this.data = data
    this.keysOrder = Object.keys(data)
  }

  setItem(key: string, value: string) {
    if (!this.hasItem(key)) this.keysOrder.push(key)
    this.data[key] = value
  }

  getItem(key: string) {
    return this.data[key]
  }

  hasItem(key: string) {
    return Object.hasOwn(this.data, key)
  }

  removeItem(key: string) {
    if (!this.hasItem(key)) return
    delete this.data[key]
    this.keysOrder = this.keysOrder.filter((k) => k !== key)
  }

  clear() {
    this.data = {}
    this.keysOrder = []
  }

  key(index: number) {
    return this.keysOrder[index]
  }

  get length() {
    return this.keysOrder.length
  }

  register(subject: WorkerGlobalScope | SharedWorkerGlobalScope) {
    // @ts-expect-error
    subject.localStorage = this
  }
}
