import type { Param } from './Param.js';
import type { StreamShareResult } from './StreamShareResult.js';

/** Pagination metadata returned with a result page. */
export interface StreamSharePagination {
    /** One-based index of the current page. */
    currentPage: number;
    /** Maximum number of items requested or returned per page. */
    itemsPerPage: number;
    /** Total matching item count when known. */
    totalItems?: number;
    /** Total page count when known. */
    totalPages?: number;
}

/** Optional aggregate values clients can expose as result filters. */
export interface StreamShareFacets {
    /** Distinct TMDB genre identifiers present in the full result set. */
    genreTmdbIds?: number[];
    /** Distinct production years present in the full result set. */
    years?: number[];
}

/** JSON response returned by a StreamShare-compatible service endpoint. */
export interface StreamShareResponse {
    /** Media, navigation, or folder results for the current page. */
    items: StreamShareResult[];
    /** Dynamic parameters clients may offer for a subsequent request. */
    additionalParams?: Param[];
    /** Pagination metadata when the endpoint is paginated. */
    pagination?: StreamSharePagination;
    /** Aggregate filter values for the complete logical result set. */
    facets?: StreamShareFacets;
}
