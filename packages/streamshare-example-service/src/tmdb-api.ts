export interface TmdbApi {
    get<T>(pathname: string, params?: Readonly<Record<string, string | number | boolean | undefined>>): Promise<T>;
}

export interface TmdbApiClientOptions {
    accessToken: string;
    baseUrl?: string;
    language?: string;
    timeoutMs?: number;
    fetch?: typeof fetch;
}

export class TmdbApiError extends Error {
    constructor(
        message: string,
        readonly status: number,
    ) {
        super(message);
        this.name = 'TmdbApiError';
    }
}

/** Minimal, dependency-free TMDB HTTP client used by the example catalogue. */
export class TmdbApiClient implements TmdbApi {
    private readonly baseUrl: string;
    private readonly fetchImpl: typeof fetch;
    private readonly language: string;
    private readonly timeoutMs: number;

    constructor(private readonly options: TmdbApiClientOptions) {
        if (!options.accessToken.trim()) {
            throw new Error('TMDB_ACCESS_TOKEN is required to run the example service.');
        }
        this.baseUrl = (options.baseUrl ?? 'https://api.themoviedb.org/3').replace(/\/$/, '');
        this.fetchImpl = options.fetch ?? globalThis.fetch;
        this.language = options.language ?? 'fr-FR';
        this.timeoutMs = options.timeoutMs ?? 10_000;
    }

    async get<T>(
        pathname: string,
        params: Readonly<Record<string, string | number | boolean | undefined>> = {},
    ): Promise<T> {
        const url = new URL(`${this.baseUrl}/${pathname.replace(/^\//, '')}`);
        const query = { language: this.language, ...params };
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined) url.searchParams.set(key, String(value));
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const response = await this.fetchImpl(url, {
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${this.options.accessToken}`,
                },
                signal: controller.signal,
            });
            if (!response.ok) {
                const body = await response.text();
                throw new TmdbApiError(
                    `TMDB request failed (${response.status}): ${body.slice(0, 300) || response.statusText}`,
                    response.status,
                );
            }
            return await response.json() as T;
        } catch (error) {
            if (error instanceof TmdbApiError) throw error;
            if (controller.signal.aborted) {
                throw new TmdbApiError(`TMDB request timed out after ${this.timeoutMs} ms.`, 504);
            }
            throw new TmdbApiError(
                `TMDB request failed: ${error instanceof Error ? error.message : String(error)}`,
                502,
            );
        } finally {
            clearTimeout(timeout);
        }
    }
}
