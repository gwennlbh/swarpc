/**
 * Groups elements from an iterable into a Map based on a callback function.
 *
 * @template K, T
 * @param {Iterable<T>} iterable - The iterable to group.
 * @param {function(T, number): K} callbackfn - The callback function to
 * determine the grouping key.
 * @returns {Map<K, T[]>} A Map where keys are the grouping keys and values are
 * arrays of grouped elements.
 */
Map.groupBy ??= function groupBy(iterable, callbackfn) {
    const map = new Map();
    let i = 0;
    for (const value of iterable) {
        const key = callbackfn(value, i++), list = map.get(key);
        list ? list.push(value) : map.set(key, [value]);
    }
    return map;
};
export {};
