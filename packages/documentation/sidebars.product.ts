import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  productSidebar: [
    'index',
    {
      type: 'category',
      label: 'StreamShare applications',
      items: [
        'application/index',
        'application/homepage',
        'application/remote-control',
        'application/media-hub',
        'application/media-library',
        'application/settings',
        'application/mobile',
        'application/tv',
        'application/media-metadata',
      ],
    },
    {
      type: 'category',
      label: 'Desktop clients',
      items: ['clients/index', 'clients/platforms'],
    },
    'support-and-compatibility',
  ],
};

export default sidebars;
