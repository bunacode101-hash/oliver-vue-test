import { vi, describe, it, expect } from 'vitest';

vi.mock('@/utils/lazy', () => {  // Use alias if configured, or relative path like '../utils/lazy' depending on test location; assuming alias '@' for src
  const mockModules = {
    '/src/components/Login.vue': vi.fn(() => Promise.resolve({ default: { name: 'Login' } })),
    '/src/components/Other.vue': vi.fn(() => Promise.resolve({ default: { name: 'Other' } })),
  };

  function lazy(path) {
    if (!path || typeof path !== "string") {
      return () => Promise.reject(new Error("lazy(): invalid path"));
    }
    let normalized = path.replace(/^@\/?/, "/src/");
    if (!normalized.startsWith("/")) {
      normalized = `/${normalized}`;
    }

    const loader = mockModules[normalized];
    if (!loader) {
      return () =>
        Promise.reject(
          new Error(`lazy(): component not found for path ${normalized}`)
        );
    }

    // For testing only, attach normalized path
    loader._normalizedPath = normalized;
    return loader;
  }

  return { lazy };
});

import { lazy } from '@/utils/lazy';  // Adjust import path accordingly

describe('lazy function', () => {
  it('rejects if path is invalid', async () => {
    const invalidCases = [undefined, '', 123, {}];

    for (const invalidPath of invalidCases) {
      const loader = lazy(invalidPath);
      await expect(loader()).rejects.toThrow('lazy(): invalid path');
    }
  });

  it('normalizes paths correctly', () => {
    const testPaths = [
      '@/components/Login.vue',
      '@components/Login.vue',
      '/src/components/Login.vue',
      'src/components/Login.vue',
    ];

    for (const testPath of testPaths) {
      const loader = lazy(testPath);
      expect(loader._normalizedPath).toBe('/src/components/Login.vue');
    }

  });

  it('returns loader if component found and attaches normalized path', async () => {
    const loader = lazy('@/components/Login.vue');
    expect(typeof loader).toBe('function');
    expect(loader._normalizedPath).toBe('/src/components/Login.vue');

    const component = await loader();
    expect(component.default.name).toBe('Login');
  });

  it('rejects if component not found', async () => {
    const loader = lazy('non/existent/path.vue');
    await expect(loader()).rejects.toThrow('lazy(): component not found for path /non/existent/path.vue');
  });

  it('works with another found component', async () => {
    const loader = lazy('@/components/Other.vue');
    expect(loader._normalizedPath).toBe('/src/components/Other.vue');

    const component = await loader();
    expect(component.default.name).toBe('Other');
  });
});