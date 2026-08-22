import type { Options as DocsOptions } from '@docusaurus/plugin-content-docs';
import type { Config } from '@docusaurus/types';
import { themes as prismThemes } from 'prism-react-renderer';

const sharedDocsOptions = {
  showLastUpdateAuthor: false,
  showLastUpdateTime: false,
  breadcrumbs: true,
  includeCurrentVersion: true,
  lastVersion: 'current',
} satisfies Partial<DocsOptions>;

const config: Config = {
  title: 'StreamShare Documentation',
  tagline: 'Public product and developer documentation for StreamShare',
  favicon: 'img/favicon.svg',

  // No deployment command is configured. This URL only defines future canonical
  // links in the locally generated static output.
  url: 'https://docs.tootiapps.com',
  baseUrl: '/',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onDuplicateRoutes: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          ...sharedDocsOptions,
          id: 'product',
          path: 'content/product',
          routeBasePath: '/',
          sidebarPath: './sidebars.product.ts',
        },
        blog: false,
        pages: false,
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
          ignorePatterns: ['/search/**'],
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],

  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        ...sharedDocsOptions,
        id: 'addons',
        path: 'content/addons',
        routeBasePath: '/addons',
        sidebarPath: './sidebars.addons.ts',
      } satisfies DocsOptions,
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        ...sharedDocsOptions,
        id: 'services',
        path: 'content/services',
        routeBasePath: '/services',
        sidebarPath: './sidebars.services.ts',
      } satisfies DocsOptions,
    ],
  ],

  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        docsDir: ['content/product', 'content/addons', 'content/services'],
        docsRouteBasePath: ['/', 'addons', 'services'],
        indexBlog: false,
        indexDocs: true,
        indexPages: false,
        language: ['en'],
        highlightSearchTermsOnTargetPage: true,
        searchResultLimits: 8,
        searchResultContextMaxLength: 50,
      },
    ],
  ],

  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'StreamShare Docs',
      hideOnScroll: true,
      items: [
        {
          type: 'docSidebar',
          docsPluginId: 'product',
          sidebarId: 'productSidebar',
          label: 'Applications',
          position: 'left',
        },
        {
          type: 'docSidebar',
          docsPluginId: 'addons',
          sidebarId: 'addonsSidebar',
          label: 'Addons',
          position: 'left',
        },
        {
          type: 'docSidebar',
          docsPluginId: 'services',
          sidebarId: 'servicesSidebar',
          label: 'Services',
          position: 'left',
        },
        {
          href: 'https://tootiapps.com',
          label: 'TootiApps',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            { label: 'Applications', to: '/' },
            { label: 'Addons', to: '/addons' },
            { label: 'Services', to: '/services' },
          ],
        },
        {
          title: 'Machine-readable',
          items: [
            { label: 'llms.txt', href: 'https://docs.tootiapps.com/llms.txt' },
            { label: 'Full Markdown context', href: 'https://docs.tootiapps.com/llms-full.txt' },
            { label: 'Documentation manifest', href: 'https://docs.tootiapps.com/markdown/manifest.json' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} TootiApps.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.nightOwl,
      additionalLanguages: ['bash', 'json', 'typescript'],
    },
  },
};

export default config;
