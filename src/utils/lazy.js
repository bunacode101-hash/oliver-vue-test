const modules = import.meta.glob("/src/components/**/*.vue");

export function lazy(path) {
  if (!path || typeof path !== "string") {
    return () => Promise.reject(new Error("lazy(): invalid path"));
  }
  if (path.includes("App.vue")) {
    return () =>
      Promise.reject(new Error("lazy(): cannot dynamically load App.vue"));
  }
  let normalized = path.replace(/^@\/?/, "/src/");
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }
  const loader = modules[normalized];
  if (!loader) {
    return () =>
      Promise.reject(
        new Error(`lazy(): component not found for path ${normalized}`)
      );
  }
  return loader;
}
