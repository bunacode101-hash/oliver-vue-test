const modules = import.meta.glob("/src/**/*.vue"); // Adjust glob pattern to match your components (e.g., '/src/components/**/*.vue' if limited to components folder)
export function lazy(path) {
  console.log(`[LAZY_CREATE] Creating lazy loader for path "${path}".`);
  if (!path || typeof path !== "string") {
    console.log(
      `[LAZY_INVALID] Invalid path provided to lazy(): "${path}". Returning rejecting promise.`
    );
    return () => Promise.reject(new Error("lazy(): invalid path"));
  }
  let normalized = path.replace(/^@\/?/, "/src/"); // Keep this for consistency; ensures keys like '/src/components/auth/log-in.vue'
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`; // Ensure leading '/' to match glob keys
  }
  const loader = modules[normalized];
  if (!loader) {
    console.log(
      `[LAZY_NOT_FOUND] No module found for normalized path "${normalized}". Returning rejecting promise.`
    );
    return () =>
      Promise.reject(
        new Error(`lazy(): component not found for path ${normalized}`)
      );
  }
  console.log(
    `[LAZY_SUCCESS] Lazy loader created successfully for normalized path "${normalized}".`
  );
  // For testing only, attach normalized path
  loader._normalizedPath = normalized;
  return loader; // Returns the loader function: () => import(...)
}