// Define the glob outside the function (top of the file)
const modules = import.meta.glob("/src/**/*.vue"); // Adjust glob pattern to match your components (e.g., '/src/components/**/*.vue' if limited to components folder)
export function lazy(path) {
  if (!path || typeof path !== "string") {
    return () => Promise.reject(new Error("lazy(): invalid path"));
  }
  let normalized = path.replace(/^@\/?/, "/src/"); // Keep this for consistency; ensures keys like '/src/components/auth/log-in.vue'
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`; // Ensure leading '/' to match glob keys
  }
  const loader = modules[normalized];
  if (!loader) {
    return () =>
      Promise.reject(
        new Error(`lazy(): component not found for path ${normalized}`)
      );
  }
  // For testing only, attach normalized path
  loader._normalizedPath = normalized;
  return loader; // Returns the loader function: () => import(...)
}