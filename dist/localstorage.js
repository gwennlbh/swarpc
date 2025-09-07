export class FauxLocalStorage {
    data;
    keysOrder;
    constructor(data) {
        this.data = data;
        this.keysOrder = Object.keys(data);
    }
    setItem(key, value) {
        if (!this.hasItem(key))
            this.keysOrder.push(key);
        this.data[key] = value;
    }
    getItem(key) {
        return this.data[key];
    }
    hasItem(key) {
        return Object.hasOwn(this.data, key);
    }
    removeItem(key) {
        if (!this.hasItem(key))
            return;
        delete this.data[key];
        this.keysOrder = this.keysOrder.filter((k) => k !== key);
    }
    clear() {
        this.data = {};
        this.keysOrder = [];
    }
    key(index) {
        return this.keysOrder[index];
    }
    get length() {
        return this.keysOrder.length;
    }
    register(subject) {
        // @ts-expect-error
        subject.localStorage = this;
    }
}
