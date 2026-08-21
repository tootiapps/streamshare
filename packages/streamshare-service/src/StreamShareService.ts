import type { APIEndpoint } from './APIEndpoint.js';
import type { ServiceAuthentication } from './ServiceAuthentication.js';

/** Public manifest that describes a StreamShare-compatible HTTP service. */
export interface StreamShareService {
    /** Protocol version implemented by the service. */
    protocolVersion: 1;
    /** Human-readable service name. */
    name: string;
    /** Short explanation of the service and its content. */
    description?: string;
    /** Absolute, service-root-relative, or data URL for the service logo. */
    logoPath?: string;
    /** Endpoints available to StreamShare clients. */
    api: APIEndpoint[];
    /** Authentication method required by protected API endpoints. */
    auth?: ServiceAuthentication;
}

/**
 * Defines a service manifest while preserving literal inference.
 * The returned value is plain JSON and can be returned by the service root endpoint.
 */
export function defineService<const T extends StreamShareService>(service: T): T {
    return service;
}
