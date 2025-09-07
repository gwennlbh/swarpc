import { describe, test, expect, beforeEach } from "vitest"
import { FauxLocalStorage } from "../src/localstorage.js"

describe("FauxLocalStorage", () => {
  let store: FauxLocalStorage

  beforeEach(() => {
    store = new FauxLocalStorage({ a: "1", b: "2" })
  })

  test("getItem returns correct value", () => {
    expect(store.getItem("a")).toBe("1")
    expect(store.getItem("b")).toBe("2")
    expect(store.getItem("c")).toBeUndefined()
  })

  test("setItem adds and updates values", () => {
    store.setItem("c", "3")
    expect(store.getItem("c")).toBe("3")
    expect(store.length).toBe(3)
    store.setItem("a", "10")
    expect(store.getItem("a")).toBe("10")
    expect(store.length).toBe(3)
  })

  test("hasItem works", () => {
    expect(store.hasItem("a")).toBe(true)
    expect(store.hasItem("c")).toBe(false)
    store.setItem("c", "3")
    expect(store.hasItem("c")).toBe(true)
  })

  test("clear removes all items", () => {
    store.clear()
    expect(store.length).toBe(0)
    expect(store.getItem("a")).toBeUndefined()
  })

  test("key returns correct key by index", () => {
    expect(store.key(0)).toBe("a")
    expect(store.key(1)).toBe("b")
    store.setItem("c", "3")
    expect(store.key(2)).toBe("c")
  })

  test("length returns number of keys", () => {
    expect(store.length).toBe(2)
    store.setItem("c", "3")
    expect(store.length).toBe(3)
    store.clear()
    expect(store.length).toBe(0)
  })
})
