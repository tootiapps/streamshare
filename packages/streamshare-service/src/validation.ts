import type { APIEndpoint } from './APIEndpoint.js';
import type { StreamShareResponse } from './StreamShareResponse.js';
import type { StreamShareResult } from './StreamShareResult.js';
import type { StreamShareService } from './StreamShareService.js';
import type {
    ServiceDeviceAuthorization,
    ServiceDeviceTokenResponse,
    ServiceTokenGrant,
} from './ServiceAuthentication.js';

/** Error thrown when a service manifest or response violates the public protocol. */
export class StreamShareProtocolError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'StreamShareProtocolError';
    }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

function isOptionalString(value: unknown): boolean {
    return value === undefined || typeof value === 'string';
}

function isOptionalBoolean(value: unknown): boolean {
    return value === undefined || typeof value === 'boolean';
}

function isOptionalFiniteNumber(value: unknown, minimum?: number, maximum?: number): boolean {
    return value === undefined
        || (typeof value === 'number'
            && Number.isFinite(value)
            && (minimum === undefined || value >= minimum)
            && (maximum === undefined || value <= maximum));
}

function isOptionalPositiveInteger(value: unknown): boolean {
    return value === undefined || (Number.isInteger(value) && Number(value) > 0);
}

function isRelativePath(value: unknown): value is string {
    return isNonEmptyString(value)
        && value.startsWith('/')
        && !value.includes('://')
        && !value.includes('?')
        && !value.includes('#');
}

function isPositiveInteger(value: unknown): boolean {
    return Number.isInteger(value) && Number(value) > 0;
}

function isServiceAuthentication(value: unknown): boolean {
    if (!isRecord(value)) return false;
    if (value['method'] === 'basic' || value['method'] === 'apikey') {
        return Object.keys(value).length === 1;
    }
    return value['method'] === 'deviceCode'
        && isRelativePath(value['deviceAuthorizationPath'])
        && isRelativePath(value['tokenPath']);
}

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every(isNonEmptyString);
}

const endpointKinds = new Set(['search', 'browse', 'recent', 'details']);
const parameterRoles = new Set([
    'query', 'mediaType', 'tmdbId', 'genre', 'year', 'season', 'episode',
    'seriesTitle', 'sort', 'minimumVotes', 'page', 'limit',
]);

function isParam(value: unknown): boolean {
    if (!isRecord(value) || !isNonEmptyString(value['id']) || !isNonEmptyString(value['label'])) return false;
    if (value['role'] !== undefined && !parameterRoles.has(String(value['role']))) return false;
    if (!isOptionalString(value['description'])
        || !isOptionalString(value['value'])
        || !isOptionalBoolean(value['hidden'])
        || !isOptionalBoolean(value['required'])) return false;
    return value['type'] === 'text'
        || (value['type'] === 'select'
            && isOptionalBoolean(value['multiple'])
            && Array.isArray(value['options'])
            && value['options'].every((option) =>
                isRecord(option) && isNonEmptyString(option['label']) && typeof option['value'] === 'string'
            )
            && new Set(value['options'].map((option) => (option as Record<string, unknown>)['value'])).size === value['options'].length);
}

function isEndpoint(value: unknown): value is APIEndpoint {
    if (!isRecord(value)) return false;
    if (!isNonEmptyString(value['id']) || !isNonEmptyString(value['label'])) return false;
    if (value['method'] !== 'GET' && value['method'] !== 'POST') return false;
    if (!isNonEmptyString(value['pathname'])
        || !String(value['pathname']).startsWith('/')
        || String(value['pathname']).includes('://')
        || String(value['pathname']).includes('?')
        || String(value['pathname']).includes('#')
        || !Array.isArray(value['params'])) return false;
    if (!endpointKinds.has(String(value['kind'])) || !isOptionalBoolean(value['hidden'])) return false;
    if (!value['params'].every(isParam)) return false;
    const paramIds = value['params'].map((param) => (param as Record<string, unknown>)['id']);
    const roles = value['params']
        .map((param) => (param as Record<string, unknown>)['role'])
        .filter((role) => role !== undefined);
    return new Set(paramIds).size === paramIds.length && new Set(roles).size === roles.length;
}

function isMetadataColor(value: unknown): boolean {
    return typeof value === 'string'
        || (Array.isArray(value)
            && (value.length === 1 || value.length === 2)
            && value.every(isNonEmptyString));
}

function isPlayLinkMetadata(value: unknown): boolean {
    if (!isRecord(value)
        || !isOptionalString(value['label'])
        || !(isNonEmptyString(value['value']) || isStringArray(value['value']))
        || !isOptionalBoolean(value['hidden'])
        || !isRecord(value['view'])
        || value['view']['type'] !== 'text') return false;
    return value['view']['color'] === undefined || isMetadataColor(value['view']['color']);
}

function isPlayLink(value: unknown): boolean {
    if (!isRecord(value) || !isNonEmptyString(value['href'])) return false;
    if (!['title', 'codec', 'quality', 'expiresAt'].every((key) => isOptionalString(value[key]))) return false;
    if (value['languages'] !== undefined && !isStringArray(value['languages'])) return false;
    if (value['subtitles'] !== undefined && !isStringArray(value['subtitles'])) return false;
    if (!isOptionalFiniteNumber(value['size'], 0) || (value['size'] !== undefined && !Number.isInteger(value['size']))) return false;
    return value['metadata'] === undefined
        || (Array.isArray(value['metadata']) && value['metadata'].every(isPlayLinkMetadata));
}

function hasValidLinks(value: Record<string, unknown>): boolean {
    return Array.isArray(value['links']) && value['links'].length > 0 && value['links'].every(isPlayLink);
}

function hasValidBase(value: Record<string, unknown>): boolean {
    return ['title', 'tagline', 'poster', 'backdrop', 'productionDate'].every((key) => isOptionalString(value[key]))
        && isOptionalFiniteNumber(value['rating'], 0, 10)
        && isOptionalFiniteNumber(value['popularity'], 0)
        && isOptionalFiniteNumber(value['voteCount'], 0)
        && (value['voteCount'] === undefined || Number.isInteger(value['voteCount']))
        && (value['year'] === undefined || (Number.isInteger(value['year']) && Number(value['year']) >= 1000 && Number(value['year']) <= 9999));
}

function hasValidTmdb(value: unknown, expectedType?: 'movie' | 'tvShow'): boolean {
    return isRecord(value)
        && Number.isInteger(value['id']) && Number(value['id']) > 0
        && (value['type'] === 'movie' || value['type'] === 'tvShow')
        && (expectedType === undefined || value['type'] === expectedType)
        && isOptionalPositiveInteger(value['episodeId'])
        && (value['numberOfSeasons'] === undefined
            || (Number.isInteger(value['numberOfSeasons']) && Number(value['numberOfSeasons']) >= 0))
        && isOptionalBoolean(value['inProduction']);
}

function hasValidEndpointReference(value: unknown): boolean {
    return isRecord(value)
        && isNonEmptyString(value['id'])
        && (value['paramsValues'] === undefined
            || (isRecord(value['paramsValues']) && Object.values(value['paramsValues']).every((entry) => typeof entry === 'string')));
}

function isResult(value: unknown): value is StreamShareResult {
    if (!isRecord(value) || !isNonEmptyString(value['type']) || !hasValidBase(value)) return false;

    switch (value['type']) {
        case 'movie':
        case 'unclassified':
            return hasValidLinks(value)
                && (value['tmdb'] === undefined || hasValidTmdb(value['tmdb']));
        case 'episode':
            return hasValidLinks(value)
                && Number.isInteger(value['season']) && Number(value['season']) > 0
                && Number.isInteger(value['episode']) && Number(value['episode']) > 0
                && (value['tmdb'] === undefined || hasValidTmdb(value['tmdb'], 'tvShow'));
        case 'series':
            return isNonEmptyString(value['title'])
                && hasValidTmdb(value['tmdb'], 'tvShow')
                && (value['endpoint'] === undefined || hasValidEndpointReference(value['endpoint']));
        case 'season':
            return isNonEmptyString(value['title'])
                && Number.isInteger(value['seasonNumber']) && Number(value['seasonNumber']) > 0
                && hasValidTmdb(value['tmdb'], 'tvShow')
                && (value['endpoint'] === undefined || hasValidEndpointReference(value['endpoint']));
        case 'folder':
            return isNonEmptyString(value['title']) && hasValidEndpointReference(value['endpoint']);
        default:
            return false;
    }
}

/**
 * Validates a service manifest and narrows its type.
 *
 * @throws {@link StreamShareProtocolError} when the manifest is invalid.
 */
export function assertStreamShareService(value: unknown): asserts value is StreamShareService {
    if (!isRecord(value)) {
        throw new StreamShareProtocolError('Service manifest must be a JSON object.');
    }
    if (!isNonEmptyString(value['name'])) {
        throw new StreamShareProtocolError('Service manifest requires a non-empty name.');
    }
    if (value['protocolVersion'] !== 1) {
        throw new StreamShareProtocolError('Service manifest requires protocolVersion: 1.');
    }
    if (!isOptionalString(value['description']) || !isOptionalString(value['logoPath'])) {
        throw new StreamShareProtocolError('Service manifest contains invalid descriptive metadata.');
    }
    if (value['auth'] !== undefined && !isServiceAuthentication(value['auth'])) {
        throw new StreamShareProtocolError('Service manifest contains an invalid authentication method.');
    }
    if (!Array.isArray(value['api']) || value['api'].length === 0 || !value['api'].every(isEndpoint)) {
        throw new StreamShareProtocolError('Service manifest contains an invalid api endpoint.');
    }
    const ids = value['api'].map((endpoint) => endpoint.id);
    if (new Set(ids).size !== ids.length) {
        throw new StreamShareProtocolError('Service endpoint IDs must be unique.');
    }
    for (const uniqueKind of ['search', 'recent']) {
        if (value['api'].filter((endpoint) => endpoint.kind === uniqueKind).length > 1) {
            throw new StreamShareProtocolError(`Service manifests may declare at most one ${uniqueKind} endpoint.`);
        }
    }
}

/** Validates a device-code challenge returned by a service. */
export function parseServiceDeviceAuthorization(value: unknown): ServiceDeviceAuthorization {
    if (!isRecord(value)
        || !isNonEmptyString(value['deviceCode'])
        || !isNonEmptyString(value['userCode'])
        || !isNonEmptyString(value['verificationUrl'])
        || !isOptionalString(value['verificationUrlComplete'])
        || !isPositiveInteger(value['expiresIn'])
        || !isPositiveInteger(value['interval'])) {
        throw new StreamShareProtocolError('Service device authorization response is invalid.');
    }
    return value as unknown as ServiceDeviceAuthorization;
}

/** Validates a successful token grant returned by a service. */
export function parseServiceTokenGrant(value: unknown): ServiceTokenGrant {
    if (!isRecord(value)
        || !isNonEmptyString(value['accessToken'])
        || !isNonEmptyString(value['refreshToken'])
        || !isPositiveInteger(value['expiresIn'])) {
        throw new StreamShareProtocolError('Service token grant is invalid.');
    }
    return value as unknown as ServiceTokenGrant;
}

/** Validates a response returned while polling the token endpoint. */
export function parseServiceDeviceTokenResponse(value: unknown): ServiceDeviceTokenResponse {
    if (!isRecord(value)) {
        throw new StreamShareProtocolError('Service device token response is invalid.');
    }
    if (value['status'] === 'pending') {
        if (value['interval'] !== undefined && !isPositiveInteger(value['interval'])) {
            throw new StreamShareProtocolError('Service device token polling interval is invalid.');
        }
        return value as unknown as ServiceDeviceTokenResponse;
    }
    if (value['status'] === 'denied' || value['status'] === 'expired') {
        return value as unknown as ServiceDeviceTokenResponse;
    }
    if (value['status'] === 'authorized') {
        parseServiceTokenGrant(value);
        return value as unknown as ServiceDeviceTokenResponse;
    }
    throw new StreamShareProtocolError('Service device token response has an invalid status.');
}

/**
 * Parses an unknown value as a validated service manifest.
 *
 * @returns The original value narrowed to {@link StreamShareService}.
 * @throws {@link StreamShareProtocolError} when validation fails.
 */
export function parseStreamShareService(value: unknown): StreamShareService {
    assertStreamShareService(value);
    return value;
}

/** Tests whether an unknown value is a valid service manifest without throwing. */
export function isStreamShareService(value: unknown): value is StreamShareService {
    try {
        assertStreamShareService(value);
        return true;
    } catch {
        return false;
    }
}

/**
 * Validates an endpoint response and narrows its type.
 *
 * @throws {@link StreamShareProtocolError} when the response is invalid.
 */
export function assertStreamShareResponse(value: unknown): asserts value is StreamShareResponse {
    if (!isRecord(value) || !Array.isArray(value['items']) || !value['items'].every(isResult)) {
        throw new StreamShareProtocolError('Service response contains invalid items.');
    }

    const facets = value['facets'];
    if (facets !== undefined) {
        if (!isRecord(facets)) {
            throw new StreamShareProtocolError('Service facets must be an object.');
        }
        for (const key of ['genreTmdbIds', 'years']) {
            const values = facets[key];
            if (values !== undefined && (!Array.isArray(values) || values.some((entry) => !Number.isInteger(entry)))) {
                throw new StreamShareProtocolError(`Service facet ${key} must contain integers.`);
            }
            if (Array.isArray(values) && new Set(values).size !== values.length) {
                throw new StreamShareProtocolError(`Service facet ${key} must contain unique values.`);
            }
        }
    }

    if (value['additionalParams'] !== undefined
        && (!Array.isArray(value['additionalParams']) || !value['additionalParams'].every(isParam))) {
        throw new StreamShareProtocolError('Service additionalParams contains an invalid parameter.');
    }
    if (Array.isArray(value['additionalParams'])) {
        const ids = value['additionalParams'].map((param) => (param as Record<string, unknown>)['id']);
        if (new Set(ids).size !== ids.length) {
            throw new StreamShareProtocolError('Service additionalParams IDs must be unique.');
        }
    }

    const pagination = value['pagination'];
    if (pagination !== undefined) {
        if (!isRecord(pagination)
            || !Number.isInteger(pagination['currentPage']) || Number(pagination['currentPage']) < 1
            || !Number.isInteger(pagination['itemsPerPage']) || Number(pagination['itemsPerPage']) < 1
            || (pagination['totalItems'] !== undefined
                && (!Number.isInteger(pagination['totalItems']) || Number(pagination['totalItems']) < 0))
            || (pagination['totalPages'] !== undefined
                && (!Number.isInteger(pagination['totalPages']) || Number(pagination['totalPages']) < 0))
            || pagination['pageLength'] !== undefined) {
            throw new StreamShareProtocolError('Service pagination is invalid.');
        }
    }
}

/**
 * Parses an unknown value as a validated endpoint response.
 *
 * @returns The original value narrowed to {@link StreamShareResponse}.
 * @throws {@link StreamShareProtocolError} when validation fails.
 */
export function parseStreamShareResponse(value: unknown): StreamShareResponse {
    assertStreamShareResponse(value);
    return value;
}

/** Tests whether an unknown value is a valid endpoint response without throwing. */
export function isStreamShareResponse(value: unknown): value is StreamShareResponse {
    try {
        assertStreamShareResponse(value);
        return true;
    } catch {
        return false;
    }
}
