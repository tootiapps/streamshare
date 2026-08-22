import type { Param } from './Param.js';

/** Semantic operation performed by a service endpoint. */
export type ServiceEndpointKind = 'search' | 'browse' | 'recent' | 'details';

/** An HTTP endpoint exposed by a StreamShare-compatible service. */
export interface APIEndpoint {
    /** Stable endpoint identifier, unique within the service manifest. */
    id: string;
    /** Human-readable name displayed by clients. */
    label: string;
    /** HTTP method used to call the endpoint. */
    method: 'GET' | 'POST';
    /** Service-root-relative URL path. */
    pathname: string;
    /** Parameters accepted by the endpoint. */
    params: Param[];
    /** Prevents clients from presenting the endpoint as a direct navigation entry. */
    hidden?: boolean;
    /** Semantic purpose used by clients to discover the endpoint. */
    kind: ServiceEndpointKind;
}
