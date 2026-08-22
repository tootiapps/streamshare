import type {
    StreamShareFacets,
    StreamShareResponse,
    StreamShareResult,
} from '@streamshare/service';

import type { TmdbApi } from './tmdb-api.js';

type CatalogType = 'movie' | 'series' | 'season' | 'episode';
type SortOption = 'date' | 'title' | 'rating' | 'popularity';
type TmdbDiscoverType = 'movie' | 'tv';

export interface CatalogSearch {
    query?: string;
    type?: CatalogType;
    tmdbId?: number;
    year?: number;
    genreTmdbIds?: number[];
    season?: number;
    episode?: number;
    sortBy?: SortOption;
    page: number;
    limit: number;
}

interface TmdbPage<T> {
    page: number;
    results: T[];
    total_pages: number;
    total_results: number;
}

interface TmdbMediaSummary {
    id: number;
    title?: string;
    name?: string;
    overview?: string;
    poster_path?: string | null;
    backdrop_path?: string | null;
    release_date?: string;
    first_air_date?: string;
    vote_average?: number;
    vote_count?: number;
    popularity?: number;
    genre_ids?: number[];
}

interface TmdbMovieDetails extends TmdbMediaSummary {
    genres?: Array<{ id: number }>;
}

interface TmdbSeasonSummary {
    id: number;
    name: string;
    overview?: string;
    poster_path?: string | null;
    air_date?: string;
    season_number: number;
    episode_count?: number;
    vote_average?: number;
}

interface TmdbSeriesDetails extends TmdbMediaSummary {
    genres?: Array<{ id: number }>;
    number_of_seasons?: number;
    in_production?: boolean;
    seasons?: TmdbSeasonSummary[];
}

interface TmdbEpisode {
    id: number;
    name: string;
    overview?: string;
    still_path?: string | null;
    air_date?: string;
    season_number: number;
    episode_number: number;
    vote_average?: number;
    vote_count?: number;
}

interface TmdbSeasonDetails extends TmdbSeasonSummary {
    episodes?: TmdbEpisode[];
}

interface PageWindow<T> {
    items: T[];
    totalItems?: number;
    totalPages: number;
}

const TMDB_PAGE_SIZE = 20;
const TMDB_MAX_PAGE = 500;

function imageUrl(path: string | null | undefined, size: 'w500' | 'w780' | 'w1280'): string | undefined {
    return path ? `https://image.tmdb.org/t/p/${size}${path}` : undefined;
}

function yearFromDate(date?: string): number | undefined {
    const year = date ? Number(date.slice(0, 4)) : Number.NaN;
    return Number.isInteger(year) && year > 0 ? year : undefined;
}

function endpointParams(entries: Record<string, string | number | undefined>): Record<string, string> {
    return Object.fromEntries(
        Object.entries(entries)
            .filter((entry): entry is [string, string | number] => entry[1] !== undefined)
            .map(([key, value]) => [key, String(value)]),
    );
}

function mediaLink(title: string, mediaUrl?: string) {
    return mediaUrl
        ? [{ title: `Demo (${title})`, href: mediaUrl, quality: '1080p', codec: 'h264' }]
        : [];
}

function commonResult(item: TmdbMediaSummary) {
    const date = item.release_date ?? item.first_air_date;
    return {
        tagline: item.overview || undefined,
        poster: imageUrl(item.poster_path, 'w500'),
        backdrop: imageUrl(item.backdrop_path, 'w1280'),
        rating: item.vote_average,
        popularity: item.popularity,
        voteCount: item.vote_count,
        year: yearFromDate(date),
        productionDate: date || undefined,
    };
}

function mapMovie(item: TmdbMediaSummary, mediaUrl?: string): StreamShareResult {
    const title = item.title ?? 'Untitled movie';
    return {
        ...commonResult(item),
        type: 'movie',
        title,
        tmdb: { id: item.id, type: 'movie' },
        links: mediaLink(title, mediaUrl),
    };
}

function mapSeries(item: TmdbMediaSummary, details?: TmdbSeriesDetails): StreamShareResult {
    const title = item.name ?? 'Untitled series';
    return {
        ...commonResult(item),
        type: 'series',
        title,
        tmdb: {
            id: item.id,
            type: 'tvShow',
            numberOfSeasons: details?.number_of_seasons,
            inProduction: details?.in_production,
        },
        endpoint: {
            id: 'search',
            paramsValues: endpointParams({ mediaType: 'season', tmdbId: item.id }),
        },
    };
}

function mapSeason(series: TmdbSeriesDetails, season: TmdbSeasonSummary): StreamShareResult {
    return {
        type: 'season',
        title: season.name || `Season ${season.season_number}`,
        tagline: season.overview || undefined,
        poster: imageUrl(season.poster_path, 'w500'),
        backdrop: imageUrl(series.backdrop_path, 'w1280'),
        rating: season.vote_average,
        year: yearFromDate(season.air_date),
        productionDate: season.air_date || undefined,
        seasonNumber: season.season_number,
        tmdb: { id: series.id, type: 'tvShow' },
        endpoint: {
            id: 'search',
            paramsValues: endpointParams({
                mediaType: 'episode',
                tmdbId: series.id,
                season: season.season_number,
            }),
        },
    };
}

function mapEpisode(
    seriesId: number,
    season: TmdbSeasonDetails,
    episode: TmdbEpisode,
    mediaUrl?: string,
): StreamShareResult {
    const title = episode.name || `S${episode.season_number}E${episode.episode_number}`;
    return {
        type: 'episode',
        title,
        tagline: episode.overview || undefined,
        poster: imageUrl(episode.still_path ?? season.poster_path, episode.still_path ? 'w780' : 'w500'),
        backdrop: imageUrl(episode.still_path ?? season.poster_path, 'w1280'),
        rating: episode.vote_average,
        voteCount: episode.vote_count,
        year: yearFromDate(episode.air_date),
        productionDate: episode.air_date || undefined,
        season: episode.season_number,
        episode: episode.episode_number,
        tmdb: { id: seriesId, type: 'tvShow', episodeId: episode.id },
        links: mediaLink(title, mediaUrl),
    };
}

function facets(items: readonly TmdbMediaSummary[]): StreamShareFacets {
    const genreTmdbIds = Array.from(new Set(items.flatMap((item) => item.genre_ids ?? []))).sort((a, b) => a - b);
    const years = Array.from(new Set(items.flatMap((item) => {
        const year = yearFromDate(item.release_date ?? item.first_air_date);
        return year === undefined ? [] : [year];
    }))).sort((a, b) => b - a);
    return { genreTmdbIds, years };
}

function localPage<T>(items: readonly T[], page: number, limit: number): PageWindow<T> {
    const start = (page - 1) * limit;
    return {
        items: items.slice(start, start + limit),
        totalItems: items.length,
        totalPages: Math.ceil(items.length / limit),
    };
}

async function remotePage<T>(
    page: number,
    limit: number,
    request: (tmdbPage: number) => Promise<TmdbPage<T>>,
): Promise<PageWindow<T>> {
    const start = (page - 1) * limit;
    const firstTmdbPage = Math.floor(start / TMDB_PAGE_SIZE) + 1;
    if (firstTmdbPage > TMDB_MAX_PAGE) return { items: [], totalItems: 0, totalPages: 0 };

    const first = await request(firstTmdbPage);
    const totalItems = Math.min(first.total_results, TMDB_MAX_PAGE * TMDB_PAGE_SIZE);
    const lastItem = Math.min(start + limit, totalItems);
    const lastTmdbPage = Math.min(TMDB_MAX_PAGE, Math.max(firstTmdbPage, Math.ceil(lastItem / TMDB_PAGE_SIZE)));
    const remainingPages = Array.from(
        { length: lastTmdbPage - firstTmdbPage },
        (_, index) => firstTmdbPage + index + 1,
    );
    const remaining = await Promise.all(remainingPages.map(request));
    const combined = [first, ...remaining].flatMap((result) => result.results);

    return {
        items: combined.slice(start % TMDB_PAGE_SIZE, (start % TMDB_PAGE_SIZE) + limit),
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
    };
}

async function filteredRemotePage<T>(
    page: number,
    limit: number,
    request: (tmdbPage: number) => Promise<TmdbPage<T>>,
    predicate: (item: T) => boolean,
): Promise<PageWindow<T>> {
    const start = (page - 1) * limit;
    const requiredMatches = start + limit + 1;
    const matches: T[] = [];
    let tmdbPage = 1;
    let totalTmdbPages = 1;

    do {
        const result = await request(tmdbPage);
        totalTmdbPages = Math.min(TMDB_MAX_PAGE, result.total_pages);
        matches.push(...result.results.filter(predicate));
        tmdbPage++;
    } while (tmdbPage <= totalTmdbPages && matches.length < requiredMatches);

    const exhausted = tmdbPage > totalTmdbPages;
    return {
        items: matches.slice(start, start + limit),
        ...(exhausted ? { totalItems: matches.length } : {}),
        totalPages: exhausted ? Math.ceil(matches.length / limit) : page + 1,
    };
}

function discoverSort(type: TmdbDiscoverType, sort?: SortOption): string {
    switch (sort) {
        case 'title': return type === 'movie' ? 'title.asc' : 'name.asc';
        case 'rating': return 'vote_average.desc';
        case 'popularity': return 'popularity.desc';
        case 'date':
        default: return type === 'movie' ? 'primary_release_date.desc' : 'first_air_date.desc';
    }
}

function response(
    items: StreamShareResult[],
    search: CatalogSearch,
    window: PageWindow<unknown>,
    responseFacets?: StreamShareFacets,
): StreamShareResponse {
    return {
        items,
        pagination: {
            currentPage: search.page,
            itemsPerPage: search.limit,
            totalItems: window.totalItems,
            totalPages: window.totalPages,
        },
        ...(responseFacets ? { facets: responseFacets } : {}),
    };
}

async function exactTmdbResult(
    api: TmdbApi,
    search: CatalogSearch,
    mediaUrl?: string,
): Promise<StreamShareResponse | undefined> {
    if (search.tmdbId === undefined) return undefined;

    if (search.type === 'season') {
        const series = await api.get<TmdbSeriesDetails>(`/tv/${search.tmdbId}`);
        const seasons = (series.seasons ?? []).filter((season) =>
            search.season === undefined || season.season_number === search.season
        );
        const window = localPage(seasons, search.page, search.limit);
        return response(window.items.map((season) => mapSeason(series, season)), search, window);
    }

    if (search.type === 'episode') {
        if (search.season === undefined) return response([], search, { items: [], totalItems: 0, totalPages: 0 });
        const season = await api.get<TmdbSeasonDetails>(`/tv/${search.tmdbId}/season/${search.season}`);
        const episodes = (season.episodes ?? []).filter((episode) =>
            search.episode === undefined || episode.episode_number === search.episode
        );
        const window = localPage(episodes, search.page, search.limit);
        return response(
            window.items.map((episode) => mapEpisode(search.tmdbId!, season, episode, mediaUrl)),
            search,
            window,
        );
    }

    if (search.type === 'series') {
        const series = await api.get<TmdbSeriesDetails>(`/tv/${search.tmdbId}`);
        series.genre_ids ??= series.genres?.map((genre) => genre.id);
        const window = { items: [series], totalItems: 1, totalPages: 1 };
        return response([mapSeries(series, series)], search, window, facets([series]));
    }

    const movie = await api.get<TmdbMovieDetails>(`/movie/${search.tmdbId}`);
    movie.genre_ids ??= movie.genres?.map((genre) => genre.id);
    const window = { items: [movie], totalItems: 1, totalPages: 1 };
    return response([mapMovie(movie, mediaUrl)], search, window, facets([movie]));
}

async function searchTitles(
    api: TmdbApi,
    search: CatalogSearch,
    mediaUrl?: string,
): Promise<StreamShareResponse> {
    const type: TmdbDiscoverType = search.type === 'series' ? 'tv' : 'movie';
    const genreIds = new Set(search.genreTmdbIds ?? []);
    const query = search.query?.trim();
    const request = (page: number) => query
        ? api.get<TmdbPage<TmdbMediaSummary>>(`/search/${type}`, {
            query,
            include_adult: false,
            page,
            ...(search.year === undefined
                ? {}
                : type === 'movie'
                    ? { primary_release_year: search.year }
                    : { first_air_date_year: search.year }),
        })
        : api.get<TmdbPage<TmdbMediaSummary>>(`/discover/${type}`, {
            include_adult: false,
            page,
            sort_by: discoverSort(type, search.sortBy),
            with_genres: search.genreTmdbIds?.join(','),
            ...(search.sortBy === 'rating' ? { 'vote_count.gte': 100 } : {}),
            ...(search.year === undefined
                ? {}
                : type === 'movie'
                    ? { primary_release_year: search.year }
                    : { first_air_date_year: search.year }),
        });
    // TMDB's text-search endpoint has no genre parameter. Scan its pages until the
    // requested StreamShare page is filled so filtering remains global and pagination
    // never depends on whichever remote page happened to be loaded first.
    const window = query && genreIds.size > 0
        ? await filteredRemotePage(
            search.page,
            search.limit,
            request,
            (item) => Array.from(genreIds).every((id) => item.genre_ids?.includes(id)),
        )
        : await remotePage(search.page, search.limit, request);
    const visibleItems = window.items;
    const mapped = type === 'tv'
        ? visibleItems.map((item) => mapSeries(item))
        : visibleItems.map((item) => mapMovie(item, mediaUrl));

    return response(mapped, search, window, facets(visibleItems));
}

export async function searchCatalog(
    api: TmdbApi,
    input: CatalogSearch,
    mediaUrl?: string,
): Promise<StreamShareResponse> {
    const search: CatalogSearch = {
        ...input,
        type: input.type ?? 'movie',
        page: Math.max(1, Math.trunc(input.page)),
        limit: Math.min(100, Math.max(1, Math.trunc(input.limit))),
    };
    return await exactTmdbResult(api, search, mediaUrl)
        ?? searchTitles(api, search, mediaUrl);
}
