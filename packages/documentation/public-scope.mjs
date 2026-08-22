/**
 * Explicit allowlist for material that may become public.
 *
 * Nothing outside these roots and entry points is consumed by the documentation
 * build. Adding a package here is a publication-scope decision and requires a
 * dedicated review.
 */
export const publicContentScopes = Object.freeze([
  {
    id: 'product',
    label: 'Applications',
    path: 'content/product',
    routeBasePath: '/',
  },
  {
    id: 'addons',
    label: 'Addons',
    path: 'content/addons',
    routeBasePath: '/addons',
  },
  {
    id: 'services',
    label: 'Services',
    path: 'content/services',
    routeBasePath: '/services',
  },
]);

export const publicApiPackages = Object.freeze([
  {
    id: 'addons-api',
    name: '@streamshare/plugin-sdk',
    entryPoints: ['../plugin-sdk/src/index.ts'],
    tsconfig: '../plugin-sdk/tsconfig.json',
    docsPath: './content/addons',
    out: './content/addons/api',
  },
  {
    id: 'services-api',
    name: '@streamshare/service',
    entryPoints: ['../streamshare-service/src/index.ts'],
    tsconfig: '../streamshare-service/tsconfig.json',
    docsPath: './content/services',
    out: './content/services/api',
  },
]);
