import routeConfig from "./routeConfig.json";

export function getRouteBySlug(path) {
  return routeConfig.find(
    (route) =>
      route.slug === path ||
      (route.dynamicRoute &&
        path.match(new RegExp(route.slug.replace(/:[^/]+/g, "[^/]+"))))
  );
}
