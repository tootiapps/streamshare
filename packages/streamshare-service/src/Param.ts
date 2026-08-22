/** Semantic roles understood by the StreamShare application. */
export type ServiceParameterRole =
    | 'query'
    | 'mediaType'
    | 'tmdbId'
    | 'genre'
    | 'year'
    | 'season'
    | 'episode'
    | 'seriesTitle'
    | 'sort'
    | 'minimumVotes'
    | 'page'
    | 'limit';

/** Fields shared by every service endpoint parameter. */
export interface ParamBase {
    /** Stable parameter identifier within the endpoint. */
    id: string;
    /** Human-readable form label. */
    label: string;
    /** Optional usage guidance displayed by clients. */
    description?: string;
    /** Hides the input from the user while allowing clients to provide a value. */
    hidden?: boolean;
    /** Whether callers must provide a value. */
    required?: boolean;
    /** Lets the application map a parameter without relying on its ID. */
    role?: ServiceParameterRole;
    /** Default or preselected value serialized as a string. */
    value?: string;
}

/** A parameter whose value is chosen from a finite list. */
export interface ParamSelect extends ParamBase {
    /** Discriminator for a selection parameter. */
    type: 'select';
    /** Whether more than one option can be selected. */
    multiple?: boolean;
    /** Values and labels offered by the client. */
    options: Array<{
        /** Human-readable option name. */
        label: string;
        /** Value sent to the service. */
        value: string;
    }>;
}

/** A free-form text parameter. */
export interface ParamText extends ParamBase {
    /** Discriminator for a text parameter. */
    type: 'text';
}

/** Endpoint parameter supported by the StreamShare service protocol. */
export type Param = ParamText | ParamSelect;
