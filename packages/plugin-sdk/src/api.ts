import type { SourceMediaItem, SourceSearchCriteria } from './source';

/** Configuration values resolved from the addon manifest and user settings. */
export type PluginConfiguration = Readonly<Record<string, string>>;

/** Host platform for one addon invocation. Future platform identifiers are allowed. */
export type PluginRuntimePlatform = 'android' | 'ios' | 'web' | (string & {});

/** Whether the addon runs with the interactive application or as durable background work. */
export type PluginRuntimeMode = 'interactive' | 'headless';

/** Reason why the current addon execution started. */
export type PluginRuntimeReason = 'manual' | 'periodic' | 'install' | 'config';

/**
 * Feature availability for the current platform and invocation mode.
 *
 * @remarks
 * Addons should inspect these flags before using an optional host API. A method
 * may remain present for structural compatibility while rejecting when its
 * corresponding capability is unavailable.
 */
export interface PluginRuntimeCapabilities {
  /** Whether {@link IPluginAPI.getConfig} is available. */
  configuration: boolean;
  /** Whether notifications can be displayed or persisted. */
  notifications: boolean;
  /** Whether isolated key-value storage is available. */
  storage: boolean;
  /** Whether isolated file storage is available. */
  files: boolean;
  /** Whether native streaming line scans are available. */
  fileScanning: boolean;
  /** Whether source catalog snapshots can be created and published. */
  sourceCatalogWrite: boolean;
  /** Whether the published source catalog can be queried. */
  sourceCatalogQuery: boolean;
  /** Whether manifest-constrained HTTP requests are available. */
  http: boolean;
  /** Whether interactive playlist and library APIs are available. */
  lists: boolean;
  /** Whether persistent background work is supported for this invocation. */
  backgroundTasks: boolean;
}

/** Execution environment and feature availability for one addon invocation. */
export interface PluginRuntime {
  /** Host platform for this invocation. */
  platform: PluginRuntimePlatform;
  /** Whether the invocation is attached to the interactive app or durable work. */
  mode: PluginRuntimeMode;
  /** Why this execution started. Interactive lifecycle calls may omit it. */
  reason?: PluginRuntimeReason;
  /** Capabilities that may safely be used during this invocation. */
  capabilities: PluginRuntimeCapabilities;
  /** Unix timestamp in milliseconds before which the current slice should finish. */
  deadline?: number;
  /** True shortly before the current background slice must yield. */
  shouldYield(): boolean;
  /** Ask the Android scheduler to continue this task in another safe slice. */
  requestContinuation(): void;
}

/** Presentation and persistence options for an addon notification. */
export interface ToastOptions {
  /** Stable identifier used to update or dismiss an existing notification. */
  id?: string;
  /** Set to `dismiss` to remove the notification identified by `id`. */
  action?: 'dismiss';
  /** User-facing notification body. */
  message: string;
  /** Optional short notification title. */
  header?: string;
  /** Display duration in milliseconds. Use `0` for a non-expiring update. */
  duration?: number;
  /** Semantic color selected from the host design system. */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'light' | 'medium' | 'dark';
  /** Preferred temporary-tooltip position. */
  position?: 'top' | 'bottom' | 'middle';
  /** Display the temporary tooltip. Defaults to true. */
  showTooltip?: boolean;
  /** Keep the notification in the notification center. Defaults to false. */
  saveInCenter?: boolean;
}

/** Metadata returned for a file in the addon's isolated storage. */
export interface PluginFileStat {
  /** Whether the relative path currently exists. */
  exists: boolean;
  /** File size in bytes, or `0` when the path does not exist. */
  size: number;
  /** Last modification time as a Unix timestamp in milliseconds. */
  modifiedAt?: number;
}

/** Paging and filtering options for the native line scanner. */
export interface PluginFileScanOptions {
  /** Opaque byte cursor returned by a previous scan. */
  cursor?: string;
  /** Maximum number of matching lines to return (1..500). */
  limit?: number;
  /** Case-insensitive substring matched by the native streaming reader. */
  query?: string;
  /** All case-insensitive substrings that a line must contain. */
  queries?: string[];
}

/** One page returned by the native line scanner. */
export interface PluginFileScanResult {
  /** Matching UTF-8 lines, without line terminators. */
  lines: string[];
  /** Opaque cursor to pass to the next scan of the same file and query. */
  nextCursor?: string;
  /** Whether more matching lines may be requested. */
  hasMore: boolean;
}

/** A source item stored in the plugin-owned native catalog. */
export interface PluginSourceCatalogItem extends SourceMediaItem {
  /** TMDB genre IDs used by the native index. They are not exposed to the Media Hub item. */
  genreTmdbIds?: number[];
  /** Optional sort value for sources which already provide popularity. */
  popularity?: number;
}

/** A playable representation attached to one logical catalog media item. */
export interface PluginSourceCatalogVariant {
  /** Stable variant ID passed back to the plugin's resolvePlayback method. */
  id: string;
  /** Stable ID of the logical media item stored in the same snapshot. */
  mediaId: string;
  /** User-facing quality label such as `1080p` or `4K`. */
  qualityLabel?: string;
  /** Technical video resolution such as `1920x1080`. */
  resolution?: string;
  /** Human-readable provider or origin label. */
  source?: string;
  /** Codec or encoding label. */
  encoding?: string;
  /** Audio or content language label. */
  language?: string;
  /** ISO-8601 date at which the variant was added. */
  addedAt?: string;
}

/** Column-oriented catalog batch. Media and playback variants are deduplicated independently. */
export interface PluginSourceCatalogBatch {
  /** Logical media and containers to insert into the draft snapshot. */
  media: PluginSourceCatalogItem[];
  /** Playable variants attached to logical media in the same batch. */
  variants?: PluginSourceCatalogVariant[];
}

/** Counts accepted from a catalog append operation or stored in a draft snapshot. */
export interface PluginSourceCatalogAppendResult {
  /** Number of logical media rows. */
  media: number;
  /** Number of playable variant rows. */
  variants: number;
}

/** Filters used when listing the addon's persisted source catalog. */
export interface PluginSourceCatalogQuery extends Partial<SourceSearchCriteria> {
  /** Opaque page token returned by the previous query. */
  pageToken?: string | number;
  /** Direct logical-media lookup, primarily used by resolvePlayback. */
  mediaId?: string;
}

/** One page returned by a native source-catalog query. */
export interface PluginSourceCatalogResult {
  /** Logical media matching the query. */
  items: PluginSourceCatalogItem[];
  /** Opaque token to pass to the next query. */
  nextPageToken?: string;
  /** Whether another page may be requested. */
  hasMore: boolean;
}

/** Public metadata for a playlist visible to the current user. */
export interface PluginList {
  /** Stable numeric playlist identifier. */
  id: number;
  /** User-facing playlist name. */
  name: string;
  /** Whether the host prevents destructive playlist changes. */
  locked?: boolean;
  /** Creation timestamp supplied by the host. */
  createdAt?: string;
  /** Last-update timestamp supplied by the host. */
  updatedAt?: string;
}

/** Media item accepted by the interactive playlist API. */
export interface PluginListItemInput {
  /** User-facing or source-provided filename. */
  filename: string;
  /** Playable media URL. */
  url: string;
  /** Host media classification. */
  type: 'movie' | 'tvShow' | 'unclassified';
  /** TMDB identifier when known. */
  tmdbID?: number;
  /** Season number for episodic content. */
  season?: number;
  /** Episode number for episodic content. */
  episode?: number;
  /** Source-provided production date. */
  production_date?: string;
  /** TMDB genre identifiers. */
  genres?: number[];
}

/** Playlist item returned by the host. */
export interface PluginListItem {
  /** Stable numeric playlist-item identifier. */
  id: number;
  /** Identifier of the containing playlist. */
  listID: number;
  /** User-facing or source-provided filename when known. */
  filename?: string;
  /** Playable media URL. */
  url: string;
  /** Host media classification when known. */
  type?: PluginListItemInput['type'];
  /** TMDB identifier when known. */
  tmdbID?: number;
  /** Season number for episodic content. */
  season?: number;
  /** Episode number for episodic content. */
  episode?: number;
  /** Source-provided production date. */
  production_date?: string;
}

/** One playlist together with its current media items. */
export interface PluginListWithItems extends PluginList {
  /** Media items currently stored in the playlist. */
  items: PluginListItem[];
}

/**
 * Capabilities exposed by StreamShare to one addon instance.
 *
 * @remarks
 * Availability depends on the runtime mode and platform. Addons must use
 * `runtime` capability fields and the public compatibility documentation rather
 * than assuming every method is available everywhere.
 */
export interface IPluginAPI {
  /** Execution environment. Headless tasks expose a deadline for cooperative checkpointing. */
  runtime: PluginRuntime;

  /** Retrieves user configuration defined by the addon manifest. */
  getConfig(): Promise<PluginConfiguration>;

  /** Displays or updates a user notification. */
  toast(messageOrOptions: string | ToastOptions): void;

  /** Dismisses the notification with the supplied stable ID. */
  dismissToast(id: string): void;

  /** Sets the progress description for the currently running action. */
  setActionProgress(progress: string): void;

  /** Logger piped to the host and development tools */
  logger: {
    /** Writes a general diagnostic message. */
    log(...args: unknown[]): void;
    /** Writes an informational diagnostic message. */
    info(...args: unknown[]): void;
    /** Writes a warning diagnostic message. */
    warn(...args: unknown[]): void;
    /** Writes an error diagnostic message. */
    error(...args: unknown[]): void;
  };

  /** Isolated persistent key-value storage for this specific plugin */
  storage: {
    /** Retrieves a string value, or `null` when the key does not exist. */
    get(key: string): Promise<string | null>;
    /** Creates or replaces a string value. */
    set(key: string, value: string): Promise<void>;
    /** Removes one key when it exists. */
    delete(key: string): Promise<void>;
    /** Removes every key owned by this addon. */
    clear(): Promise<void>;
  };

  /**
   * Isolated file storage for large plugin-owned datasets.
   * Paths are always relative to the plugin directory; traversal is rejected.
   */
  files: {
    /** Creates or updates a UTF-8 file at a package-relative path. */
    write(path: string, data: string, options?: { append?: boolean }): Promise<void>;
    /** Reads a UTF-8 file, or returns `null` when it does not exist. */
    read(path: string): Promise<string | null>;
    /** Returns existence, size, and modification metadata for a file. */
    stat(path: string): Promise<PluginFileStat>;
    /** Deletes a file when it exists. */
    delete(path: string): Promise<void>;
    /** Atomically moves or renames a file within the addon's storage. */
    move(from: string, to: string): Promise<void>;
    /** Streams matching lines without loading an entire large file into memory. */
    scanLines(path: string, options?: PluginFileScanOptions): Promise<PluginFileScanResult>;
  };

  /**
   * Indexed, isolated storage for large source catalogs.
   *
   * A snapshot is invisible until commitSnapshot succeeds, so interactive reads
   * keep using the previous snapshot while a synchronization is running.
   */
  sourceCatalog: {
    /** Resume a durable unpublished snapshot when requested and available. */
    beginSnapshot(options?: { resume?: boolean }): Promise<string>;
    /** Appends a bounded batch of logical media and variants to a draft snapshot. */
    append(snapshotId: string, batch: PluginSourceCatalogBatch): Promise<PluginSourceCatalogAppendResult>;
    /** Durable row counts, useful when resuming after process termination. */
    getSnapshotStats(snapshotId: string): Promise<PluginSourceCatalogAppendResult>;
    /** Atomically publishes a completed snapshot for interactive queries. */
    commitSnapshot(snapshotId: string): Promise<void>;
    /** Deletes an unpublished snapshot and its temporary data. */
    abortSnapshot(snapshotId: string): Promise<void>;
    /** Query unique logical media before pagination. */
    query(criteria: PluginSourceCatalogQuery): Promise<PluginSourceCatalogResult>;
    /** Expand matching logical media into their playable variants. */
    queryVariants(criteria: PluginSourceCatalogQuery): Promise<PluginSourceCatalogResult>;
  };

  /** Native HTTP capability constrained by the manifest network allowlist. */
  http: {
    /** Retrieves raw text content from an allowed HTTP(S) URL. */
    get(url: string, headers?: Record<string, string>): Promise<string>;
  };

  /** Interactive playlist and library management capabilities. */
  lists: {
    /** Returns playlists visible to the current user. */
    getAll(): Promise<PluginList[]>;
    /** Returns one playlist and its items, or `null` when it does not exist. */
    getById(id: number): Promise<PluginListWithItems | null>;
    /** Creates a playlist when permitted by the current account and returns its numeric identifier. */
    create(name: string): Promise<number>;
    /** Adds one media item to a playlist and returns the new item identifier. */
    addItem(
      listId: number,
      item: PluginListItemInput,
    ): Promise<number>;
    /** Adds multiple media items atomically and returns the number accepted. */
    addItems(
      listId: number,
      items: PluginListItemInput[],
    ): Promise<number>;
    /** Removes one playlist item by its item identifier. */
    removeItem(itemId: number): Promise<void>;
    /** Removes every item from a playlist while retaining the playlist. */
    clear(listId: number): Promise<void>;
    /** Requests metadata enrichment for items in a playlist. */
    enrichList(listId: number): Promise<void>;
  };
}
