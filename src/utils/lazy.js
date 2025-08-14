export function lazy(path) {
  if (!path || typeof path !== "string") {
    return () => Promise.reject(new Error("lazy(): invalid path"));
  }
  const normalized = path.replace(/^@\/?/, "/src/");
  return () =>
    import(/* @vite-ignore */ normalized).then((m) =>
      m?.default ? m : { default: m }
    );
}
