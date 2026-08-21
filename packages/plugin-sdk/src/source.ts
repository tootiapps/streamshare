import type { IPluginAPI } from './api';
import type { PluginActionParameters, SystemEventContext } from './plugin';

/** Media shapes understood by the public source-addon contract. */
export type SourceMediaType = 'movie' | 'series' | 'season' | 'episode' | 'folder' | 'video';
/** Sort modes a source can apply before pagination. */
export type SourceSortOption = 'relevance' | 'date' | 'rating' | 'title' | 'popularity';

/** Search, filtering, and lookup values passed to a source addon. */
export interface SourceSearchCriteria {
  /** Free-text query entered by the user. */
  query?: string;
  /** Media types that may be returned. */
  types?: SourceMediaType[];
  /** TMDB genre identifiers that returned items should match. */
  genreTmdbIds?: number[];
  /** Four-digit production or release year. */
  year?: number;
  /** Sort mode requested by the host. */
  sortBy?: SourceSortOption;
  /** Maximum preferred number of logical items in the page. */
  limit?: number;
  /** TMDB identifier of the parent series or container. */
  parentTmdbId?: number;
  /** Season number of the requested parent context. */
  parentSeason?: number;
  /** Episode number of the requested parent context. */
  parentEpisode?: number;
  /** Human-readable parent title for sources without a stable metadata ID. */
  parentTitle?: string;
  /** Direct TMDB lookup target. */
  targetTmdbId?: number;
  /** Direct IMDb lookup target. */
  targetImdbId?: string;
  /**
   * Opaque item ID previously returned by this source for the selected media.
   * During source selection, prefer this value over an enriched or localized
   * title when it belongs to the receiving source.
   */
  targetSourceItemId?: string;
  /**
   * Whether the request is selecting playback for a known item. Sources that
   * advertise playback variants should return one playable item per variant.
   */
  isSourceSelection?: boolean;
  /** Whether the host asks the source to avoid optional metadata enrichment. */
  noEnrich?: boolean;
  /** Whether the source may omit expensive facet computation. */
  noFacets?: boolean;
}

/** Features implemented by a source and advertised to the host. */
export interface SourceCapabilities {
  /** Whether {@link ISourcePlugin.search} is supported. */
  supportsSearch: boolean;
  /**
   * Whether {@link ISourcePlugin.browse} accepts the source's own previously
   * returned container IDs and returns their direct children.
   */
  supportsBrowse: boolean;
  /** Whether the source can apply the `types` criterion. */
  supportsTypeFilter: boolean;
  /** Whether the source can apply TMDB genre filters. */
  supportsGenreFilter: boolean;
  /** Whether the source can apply production-year filters. */
  supportsYearFilter: boolean;
  /**
   * Whether the source applies direct TMDB criteria such as `targetTmdbId` and
   * `parentTmdbId`. This is independent from host enrichment of returned items.
   */
  supportsTmdbLookup: boolean;
  /**
   * The source can expand one logical media item into several playback variants
   * when search receives `isSourceSelection: true`.
   */
  supportsPlaybackVariants?: boolean;
  /** Sort modes applied by the source before pagination. */
  supportedSorts?: SourceSortOption[];
  /**
   * Container and media types returned by this source. Generic playable videos
   * use `video`, set `isContainer: false`, and are resolved like any other item.
   */
  supportedTypes: SourceMediaType[];
}

/** Identity, availability, and capabilities of one source exposed by an addon. */
export interface SourceInfo {
  /** Stable ID inside the plugin. The host namespaces it with the plugin ID. */
  id: string;
  /** Human-readable source name. */
  name: string;
  /**
   * Optional source-specific icon. A package-relative asset overrides manifest.icon;
   * HTTPS URLs are also supported.
   */
  icon?: string;
  /** Whether the source is currently configured and usable. */
  isAvailable: boolean;
  /** Whether the source should be omitted from normal source pickers. */
  isHidden?: boolean;
  /** Features the host may safely invoke on this source. */
  capabilities: SourceCapabilities;
}

/** A compact addon-defined badge displayed with a playable source. */
export interface SourceTag {
  /** Short user-facing label. Hosts may truncate labels longer than 32 characters. */
  label: string;
  /** Optional six-digit hexadecimal background color (`#RRGGBB`). */
  color?: `#${string}`;
}

/** Logical media or container returned by a source addon. */
export interface SourceMediaItem {
  /** Stable source identifier. It is passed back to resolvePlayback. */
  id: string;
  /** Shape of this item. */
  type: SourceMediaType;
  /** User-facing title. */
  title: string;
  /** Whether selecting the item should browse children instead of starting playback. */
  isContainer: boolean;
  /**
   * Authoritative TMDB identifier for this media. The host may use it for
   * enrichment and exact cross-source reconciliation; omit it when only guessed.
   */
  tmdbId?: number;
  /** IMDb identifier when known. */
  imdbId?: string;
  /** Optional source-provided content or deduplication hash. */
  hash?: string;
  /** Duration in 100-nanosecond ticks. */
  runTimeTicks?: number;
  /** Compact image suitable for rows or source-specific lists. */
  thumbnailUrl?: string;
  /** ISO-8601 premiere or release date. */
  premiereDate?: string;
  /** Four-digit production year. */
  productionYear?: number;
  /** Original-language title. */
  originalTitle?: string;
  /** Plot or content summary. */
  overview?: string;
  /** Source-provided rating normalized to the inclusive 0-to-10 scale. */
  rating?: number;
  /** Human-readable genres. */
  genres?: { name: string }[];
  /** Portrait artwork URL. */
  posterUrl?: string;
  /** Landscape artwork URL. */
  backdropUrl?: string;
  /** Season number for season and episode items. */
  seasonNumber?: number;
  /** Episode number for episode items. */
  episodeNumber?: number;
  /**
   * Authoritative TMDB series identifier used to enrich and reconcile a season
   * or episode in its parent context; omit it when only guessed.
   */
  seriesTmdbId?: number;
  /** Parent series title for a season or episode. */
  seriesTitle?: string;
  /** Number of known direct children for a container. */
  childrenCount?: number;
  /** Composite or legacy quality label. Prefer the structured fields below when known. */
  qualityLabel?: string;
  /** Technical resolution such as `1920x1080`. */
  resolution?: string;
  /** Human-readable distribution origin such as `WEB-DL` or `BluRay`. */
  source?: string;
  /** Codec or encoding label. */
  encoding?: string;
  /** Audio or content language label. */
  language?: string;
  /** Addon-defined badges for metadata that does not fit the structured technical fields. */
  tags?: SourceTag[];
  /** ISO-8601 date at which the source added this item. */
  addedAt?: string;
}

/** Filter values available for the current result set. */
export interface SourceFacets {
  /** Unique TMDB genre identifiers present in matching items. */
  genreTmdbIds?: number[];
  /** Unique production years present in matching items. */
  years?: number[];
}

/** One page of logical media returned by search or browse. */
export interface SourcePagedResult {
  /** Logical items in this page. */
  items: SourceMediaItem[];
  /** Opaque token to pass unchanged when requesting the next page. */
  nextPageToken?: string | number;
  /** Whether another page can be requested. */
  hasMore: boolean;
  /** Optional filters computed for the matching result set. */
  facets?: SourceFacets;
}

/** Playable resource resolved from a logical source item. */
export interface SourcePlaybackInfo {
  /** Absolute or source-supported media URL. */
  url: string;
  /** MIME type when it cannot be inferred reliably from the URL. */
  mimeType?: string;
  /**
   * HTTP headers required when requesting the media. The host forwards them to
   * playback targets that support custom request headers; support can vary by
   * target, so test the platforms declared compatible by the addon.
   */
  headers?: Record<string, string>;
  /** Known media duration in milliseconds. */
  durationMs?: number;
  /** Suggested resume position in milliseconds. */
  resumePositionMs?: number;
}

/**
 * Contract implemented by plugins whose manifest type is `source`.
 *
 * @example
 * ```ts
 * class CatalogSource implements ISourcePlugin {
 *   async onInit(api: IPluginAPI) {
 *     api.logger.info('Catalog source initialized');
 *   }
 *
 *   getSourceInfo(): SourceInfo {
 *     return {
 *       id: 'catalog',
 *       name: 'Catalog',
 *       isAvailable: true,
 *       capabilities: {
 *         supportsSearch: true,
 *         supportsBrowse: true,
 *         supportsTypeFilter: true,
 *         supportsGenreFilter: false,
 *         supportsYearFilter: false,
 *         supportsTmdbLookup: false,
 *         supportedTypes: ['movie', 'folder'],
 *       },
 *     };
 *   }
 *
 *   async search(): Promise<SourcePagedResult> {
 *     return {items: [], hasMore: false};
 *   }
 *
 *   async browse(): Promise<SourcePagedResult> {
 *     return {items: [], hasMore: false};
 *   }
 *
 *   async getRecent(): Promise<SourceMediaItem[]> {
 *     return [];
 *   }
 *
 *   async resolvePlayback(sourceItemId: string): Promise<SourcePlaybackInfo> {
 *     return {url: `https://media.example.com/${encodeURIComponent(sourceItemId)}`};
 *   }
 * }
 * ```
 */
export interface ISourcePlugin {
  /** Receives the scoped host API before any other source method is invoked. */
  onInit(api: IPluginAPI): Promise<void>;
  /** Returns stable source identity, availability, and capabilities. */
  getSourceInfo(): Promise<SourceInfo> | SourceInfo;
  /** Searches logical media and applies supported criteria before pagination. */
  search(criteria: SourceSearchCriteria, pageToken?: string | number): Promise<SourcePagedResult>;
  /** Browses the root or children of a source container. */
  browse(
    parentId?: string,
    pageToken?: string | number,
    criteria?: Partial<SourceSearchCriteria>,
  ): Promise<SourcePagedResult>;
  /** Returns a bounded list of recently added or updated logical items. */
  getRecent(limit: number): Promise<SourceMediaItem[]>;
  /** Resolves one logical source item to a playable resource. */
  resolvePlayback(sourceItemId: string): Promise<SourcePlaybackInfo>;
  /** Handles an event declared in the addon manifest. */
  onEvent?(event: SystemEventContext): Promise<void>;
  /** Handles an action declared in the addon manifest. */
  onAction?(params: PluginActionParameters, actionId: string): Promise<void>;
}
