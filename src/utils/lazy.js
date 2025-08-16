const modules = import.meta.glob("/src/components/**/*.vue");

export function lazy(path) {
  if (!path || typeof path !== "string") {
    console.log(`Invalid path provided: "${path}".`);
    return () => Promise.reject(new Error("lazy(): invalid path"));
  }
  if (path.includes("App.vue")) {
    console.log(`Attempted to lazily load App.vue.`);
    return () =>
      Promise.reject(new Error("lazy(): cannot dynamically load App.vue"));
  }
  let normalized = path.replace(/^@\/?/, "/src/");
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }
  const loader = modules[normalized];
  if (!loader) {
    console.log(`No module found for path "${normalized}".`);
    return () =>
      Promise.reject(
        new Error(`lazy(): component not found for path ${normalized}`)
      );
  }
  return loader;
}
