/** Navigation target that requests another endpoint with optional fixed values. */
export interface BrowseEndpoint {
    /** Identifier of an endpoint declared in the service manifest. */
    id: string;
    /** Parameter values applied when following the navigation target. */
    paramsValues?: Record<string, string>;
}

/** Color accepted by clients when rendering a metadata badge. */
export type MetadataColor =
    | [background: string, foreground?: string]
    | 'danger'
    | 'dark'
    | 'light'
    | 'medium'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'tertiary'
    | 'warning';

/** Metadata displayed next to a playable link. */
export interface PlayLinkMetadata {
    /** Optional label shown before the value. */
    label?: string;
    /** One or more values presented to the user. */
    value: string | string[];
    /** Keeps the metadata available to clients without displaying it by default. */
    hidden?: boolean;
    /** Presentation hint for the metadata value. */
    view: {
        /** Supported metadata renderer. */
        type: 'text';
        /** Optional semantic or explicit color. */
        color?: MetadataColor;
    };
}

/** A directly playable media URL and its descriptive attributes. */
export interface PlayLink {
    /** Absolute or service-resolvable playback URL. */
    href: string;
    /** Optional display name for the variant. */
    title?: string;
    /** Codec label, for example `H.264`. */
    codec?: string;
    /** Quality label, for example `1080p`. */
    quality?: string;
    /** Audio languages available in this variant. */
    languages?: string[];
    /** Subtitle languages available in this variant. */
    subtitles?: string[];
    /** Approximate payload size in bytes. */
    size?: number;
    /** ISO-8601 timestamp after which the URL is no longer valid. */
    expiresAt?: string;
    /** Additional structured attributes displayed by clients. */
    metadata?: PlayLinkMetadata[];
}

/** Reference used by clients to enrich service results with TMDB metadata. */
export interface StreamShareTmdbReference {
    /** TMDB movie or series identifier. */
    id: number;
    /** Media namespace of the referenced TMDB identifier. */
    type: 'movie' | 'tvShow';
    /** TMDB episode ID when `id` identifies the parent series. */
    episodeId?: number;
    /** Number of published or known seasons for a series. */
    numberOfSeasons?: number;
    /** Whether the referenced series is still in production. */
    inProduction?: boolean;
}

/** Common descriptive metadata shared by every service result. */
export interface StreamShareResultBase {
    /** Primary display title. */
    title?: string;
    /** Short secondary description. */
    tagline?: string;
    /** Portrait artwork URL. */
    poster?: string;
    /** Landscape artwork URL. */
    backdrop?: string;
    /** Normalized rating supplied by the service. */
    rating?: number;
    /** Four-digit production or release year. */
    year?: number;
    /** Service-defined popularity score. */
    popularity?: number;
    /** Number of votes used to calculate the rating. */
    voteCount?: number;
    /** Precise release date formatted as YYYY-MM-DD. */
    productionDate?: string;
}

/** Shared fields for results that contain one or more playable variants. */
export interface StreamShareMediaResult extends StreamShareResultBase {
    /** Source filename when it is useful to distinguish the media. */
    filename?: string;
    /** ISO-8601 timestamp of the most recent playback. */
    lastPlayedAt?: string;
    /** Available playback variants. */
    links: PlayLink[];
    /** Optional TMDB reference used for metadata enrichment. */
    tmdb?: StreamShareTmdbReference;
}

/** A playable movie result. */
export interface StreamShareResultMovie extends StreamShareMediaResult {
    /** Movie discriminator. */
    type: 'movie';
}

/** A playable television episode result. */
export interface StreamShareResultEpisode extends StreamShareMediaResult {
    /** Episode discriminator. */
    type: 'episode';
    /** One-based season number. */
    season: number;
    /** One-based episode number within the season. */
    episode: number;
}

/** A playable result whose media category is not known. */
export interface StreamShareResultUnclassified extends StreamShareMediaResult {
    /** Unclassified-media discriminator. */
    type: 'unclassified';
}

/** A series navigation result, normally leading to its seasons. */
export interface StreamShareResultSeries extends StreamShareResultBase {
    /** Series discriminator. */
    type: 'series';
    /** Required series title. */
    title: string;
    /** TMDB series reference. */
    tmdb: StreamShareTmdbReference & { type: 'tvShow' };
    /** Optional endpoint used to list the series contents. */
    endpoint?: BrowseEndpoint;
}

/** A season navigation result, normally leading to its episodes. */
export interface StreamShareResultSeason extends StreamShareResultBase {
    /** Season discriminator. */
    type: 'season';
    /** Required season title. */
    title: string;
    /** One-based season number. */
    seasonNumber: number;
    /** TMDB reference to the parent series. */
    tmdb: StreamShareTmdbReference & { type: 'tvShow' };
    /** Optional endpoint used to list the season contents. */
    endpoint?: BrowseEndpoint;
}

/** A generic folder that leads to another service request. */
export interface StreamShareResultFolder extends StreamShareResultBase {
    /** Folder discriminator. */
    type: 'folder';
    /** Required folder title. */
    title: string;
    /** Endpoint invoked when the folder is opened. */
    endpoint: BrowseEndpoint;
}

/** Any result item accepted by a StreamShare-compatible client. */
export type StreamShareResult =
    | StreamShareResultMovie
    | StreamShareResultSeries
    | StreamShareResultSeason
    | StreamShareResultEpisode
    | StreamShareResultUnclassified
    | StreamShareResultFolder;

/** Discriminator values supported by {@link StreamShareResult}. */
export type StreamShareItemType = StreamShareResult['type'];
