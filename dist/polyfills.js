Map.groupBy ??= function groupBy(iterable, callbackfn) {
  const map = new Map;
  let i = 0;
  for (const value of iterable) {
    const key = callbackfn(value, i++), list = map.get(key);
    list ? list.push(value) : map.set(key, [value]);
  }
  return map;
};

export {};
