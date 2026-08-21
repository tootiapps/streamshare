import {
  type IPluginAPI,
  type ISourcePlugin,
  registerPlugin,
  type SourceInfo,
  type SourceMediaItem,
  type SourcePagedResult,
  type SourcePlaybackInfo,
  type SourceSearchCriteria,
} from '@streamshare/plugin-sdk';

const PAGE_SIZE = 2;

const MOVIES: SourceMediaItem[] = [
  {
    id: 'movie:big-buck-bunny',
    type: 'movie',
    title: 'Big Buck Bunny',
    isContainer: false,
    tmdbId: 10378,
    productionYear: 2008,
    resolution: '1080p',
    source: 'WEB-DL',
    encoding: 'H.264',
    language: 'MULTI',
    addedAt: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 'movie:sintel',
    type: 'movie',
    title: 'Sintel',
    isContainer: false,
    tmdbId: 45745,
    productionYear: 2010,
    resolution: '1080p',
    source: 'WEB-DL',
    encoding: 'H.264',
    language: 'VO',
    addedAt: '2026-01-14T10:00:00.000Z',
  },
  {
    id: 'movie:spring',
    type: 'movie',
    title: 'Spring',
    isContainer: false,
    tmdbId: 593048,
    productionYear: 2019,
    resolution: '1080p',
    source: 'WEB-DL',
    encoding: 'H.264',
    language: 'VO',
    addedAt: '2026-01-13T10:00:00.000Z',
  },
];

const SERIES: SourceMediaItem = {
  id: 'series:orbit',
  type: 'series',
  title: 'Orbit Station',
  isContainer: true,
  productionYear: 2025,
  overview: 'A demonstration series with one season and two episodes.',
  childrenCount: 1,
  addedAt: '2026-01-10T10:00:00.000Z',
};

const SEASON: SourceMediaItem = {
  id: 'season:orbit:1',
  type: 'season',
  title: 'Season 1',
  isContainer: true,
  seriesTitle: SERIES.title,
  seasonNumber: 1,
  childrenCount: 2,
};

const EPISODES: SourceMediaItem[] = [
  {
    id: 'episode:orbit:1:1',
    type: 'episode',
    title: 'Arrival',
    isContainer: false,
    seriesTitle: SERIES.title,
    seasonNumber: 1,
    episodeNumber: 1,
    productionYear: 2025,
    resolution: '2160p',
    source: 'WEB-DL',
    encoding: 'HEVC',
    language: 'MULTI',
    addedAt: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'episode:orbit:1:2',
    type: 'episode',
    title: 'First Contact',
    isContainer: false,
    seriesTitle: SERIES.title,
    seasonNumber: 1,
    episodeNumber: 2,
    productionYear: 2025,
    resolution: '1080p',
    source: 'WEB-DL',
    encoding: 'H.264',
    language: 'VOSTFR',
    addedAt: '2026-01-11T10:00:00.000Z',
  },
];

const VIDEO: SourceMediaItem = {
  id: 'video:cosmos-livestream',
  type: 'video',
  title: 'Cosmos Livestream',
  isContainer: false,
  qualityLabel: '1080p live',
  language: 'VO',
  addedAt: '2026-01-12T10:00:00.000Z',
};

const SEARCHABLE_ITEMS = [...MOVIES, SERIES, ...EPISODES, VIDEO];
const PLAYBACK_URLS: Readonly<Record<string, string>> = {
  'movie:big-buck-bunny': 'https://video.blender.org/download/web-videos/6402b77c-b61f-4a06-96ca-c8420a2becf4-1080.mp4',
  'movie:sintel': 'https://video.blender.org/download/web-videos/0eb052d0-fd51-43e6-aa33-ecdbf77a5d40-818.mp4',
  'movie:spring': 'https://video.blender.org/download/web-videos/3d95fb3d-c866-42c8-9db1-fe82f48ccb95-804.mp4',
  'episode:orbit:1:1': 'https://media.example.com/streamshare-example/orbit-s01e01.m3u8',
  'episode:orbit:1:2': 'https://media.example.com/streamshare-example/orbit-s01e02.m3u8',
  'video:cosmos-livestream': 'https://media.example.com/streamshare-example/cosmos-live.m3u8',
};

function normalized(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
}

function pageOffset(pageToken?: string | number): number {
  const value = Number(pageToken ?? 0);
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

function paginate(
  items: SourceMediaItem[],
  pageToken?: string | number,
  preferredLimit?: number,
): SourcePagedResult {
  const offset = pageOffset(pageToken);
  const limit = Math.max(1, Math.min(20, preferredLimit ?? PAGE_SIZE));
  const page = items.slice(offset, offset + limit);
  const nextOffset = offset + page.length;
  return {
    items: page,
    hasMore: nextOffset < items.length,
    nextPageToken: nextOffset < items.length ? String(nextOffset) : undefined,
  };
}

function sortItems(items: SourceMediaItem[], criteria: SourceSearchCriteria): SourceMediaItem[] {
  const query = normalized(criteria.query?.trim() ?? '');
  return [...items].sort((left, right) => {
    if (criteria.sortBy === 'title') return left.title.localeCompare(right.title);
    if (criteria.sortBy === 'rating') return (right.rating ?? 0) - (left.rating ?? 0);
    if (criteria.sortBy === 'relevance' && query) {
      const leftTitle = normalized(left.title);
      const rightTitle = normalized(right.title);
      const rank = (title: string) => title === query ? 0 : title.startsWith(query) ? 1 : 2;
      const difference = rank(leftTitle) - rank(rightTitle);
      if (difference !== 0) return difference;
    }
    return (right.addedAt ?? '').localeCompare(left.addedAt ?? '');
  });
}

function filterItems(criteria: SourceSearchCriteria): SourceMediaItem[] {
  const query = normalized(criteria.query?.trim() ?? '');
  const items = SEARCHABLE_ITEMS.filter((item) => {
    if (criteria.types?.length && !criteria.types.includes(item.type)) return false;
    if (criteria.year && item.productionYear !== criteria.year) return false;
    if (criteria.targetTmdbId && item.tmdbId !== criteria.targetTmdbId) return false;
    if (criteria.parentTmdbId) {
      const seriesTmdbId = item.type === 'series' ? item.tmdbId : item.seriesTmdbId;
      if (seriesTmdbId !== criteria.parentTmdbId) return false;
    }
    if (query && !normalized(`${item.title} ${item.seriesTitle ?? ''}`).includes(query)) return false;
    return true;
  });
  return sortItems(items, criteria);
}

class ExampleCatalogSource implements ISourcePlugin {
  async onInit(api: IPluginAPI): Promise<void> {
    api.logger.info('Example catalog source initialized.');
  }

  getSourceInfo(): SourceInfo {
    return {
      id: 'example-catalog',
      name: 'Example Catalog',
      isAvailable: true,
      capabilities: {
        supportsSearch: true,
        supportsBrowse: true,
        supportsTypeFilter: true,
        supportsGenreFilter: false,
        supportsYearFilter: true,
        supportsTmdbLookup: true,
        supportedSorts: ['relevance', 'date', 'rating', 'title'],
        supportedTypes: ['movie', 'series', 'season', 'episode', 'folder', 'video'],
      },
    };
  }

  async search(criteria: SourceSearchCriteria, pageToken?: string | number): Promise<SourcePagedResult> {
    const matchingItems = filterItems(criteria);
    const result = paginate(matchingItems, pageToken, criteria.limit);
    result.facets = {
      years: [...new Set(matchingItems
        .map((item) => item.productionYear)
        .filter((year): year is number => year !== undefined))]
        .sort((left, right) => right - left),
    };
    return result;
  }

  async browse(
    parentId?: string,
    pageToken?: string | number,
    criteria: Partial<SourceSearchCriteria> = {},
  ): Promise<SourcePagedResult> {
    if (!parentId || parentId === '__root__') {
      return {
        items: [
          { id: 'folder:movies', type: 'folder', title: 'Movies', isContainer: true },
          { id: 'folder:series', type: 'folder', title: 'Series', isContainer: true },
          { id: 'folder:videos', type: 'folder', title: 'Videos', isContainer: true },
        ],
        hasMore: false,
      };
    }
    if (parentId === 'folder:movies') return paginate(MOVIES, pageToken, criteria.limit);
    if (parentId === 'folder:series') return paginate([SERIES], pageToken, criteria.limit);
    if (parentId === 'folder:videos') return paginate([VIDEO], pageToken, criteria.limit);
    if (parentId === SERIES.id) return paginate([SEASON], pageToken, criteria.limit);
    if (parentId === SEASON.id) return paginate(EPISODES, pageToken, criteria.limit);
    return { items: [], hasMore: false };
  }

  async getRecent(limit: number): Promise<SourceMediaItem[]> {
    const safeLimit = Math.max(1, Math.min(20, Number(limit) || PAGE_SIZE));
    return sortItems([...MOVIES, SERIES], { sortBy: 'date' }).slice(0, safeLimit);
  }

  async resolvePlayback(sourceItemId: string): Promise<SourcePlaybackInfo> {
    const url = PLAYBACK_URLS[sourceItemId];
    if (!url) throw new Error(`No playable media exists for '${sourceItemId}'.`);
    return { url };
  }
}

registerPlugin(new ExampleCatalogSource());
