import { assertStreamShareResponse, assertStreamShareService } from '@streamshare/service';
import cors from 'cors';
import express, { type Express, type Request } from 'express';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { searchCatalog, type CatalogSearch } from './catalog.js';
import { createDemoAuthentication, type DemoAuthenticationOptions } from './authentication.js';
import { createServiceManifest } from './service.js';
import { TmdbApiClient, TmdbApiError, type TmdbApi } from './tmdb-api.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export interface CreateAppOptions {
    mediaUrl?: string;
    logoUrl?: string;
    tmdbApi?: TmdbApi;
    tmdbAccessToken?: string;
    tmdbLanguage?: string;
    authentication?: DemoAuthenticationOptions;
}

function positiveInteger(value: unknown, fallback: number): number {
    const parsed = typeof value === 'string' && value.trim() !== '' ? Number(value) : Number.NaN;
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function optionalInteger(value: unknown): number | undefined {
    if (typeof value !== 'string' || value.trim() === '') return undefined;
    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : undefined;
}

function queryValue(request: Request, ...keys: string[]): string | undefined {
    for (const key of keys) {
        const value = request.query[key];
        if (typeof value === 'string') return value;
    }
    return undefined;
}

function readSearch(request: Request): CatalogSearch {
    const rawType = queryValue(request, 'mediaType', 'type');
    const allowedTypes = ['movie', 'series', 'season', 'episode'] as const;
    const type = allowedTypes.find((candidate) => candidate === rawType);
    const rawSort = queryValue(request, 'sortBy', 'sort');
    const allowedSorts = ['date', 'title', 'rating', 'popularity'] as const;
    const sortBy = allowedSorts.find((candidate) => candidate === rawSort);
    const genres = queryValue(request, 'genre', 'genres')
        ?.split(',')
        .map((value) => Number(value))
        .filter(Number.isInteger);

    return {
        query: queryValue(request, 'q', 'query'),
        type,
        tmdbId: optionalInteger(queryValue(request, 'tmdbId', 'tmdb_id')),
        year: optionalInteger(queryValue(request, 'year', 'y')),
        genreTmdbIds: genres?.length ? genres : undefined,
        season: optionalInteger(queryValue(request, 'season', 's')),
        episode: optionalInteger(queryValue(request, 'episode', 'e', 'ep')),
        sortBy,
        page: positiveInteger(queryValue(request, 'page'), 1),
        limit: positiveInteger(queryValue(request, 'limit'), 50),
    };
}

export async function createApp(options: CreateAppOptions = {}): Promise<Express> {
    const mediaUrl = options.mediaUrl ?? '/assets/demo.mp4';
    const logoUrl = options.logoUrl ?? `data:image/png;base64,${(
        await readFile(path.join(packageRoot, 'assets', 'Service-Symbol.png'))
    ).toString('base64')}`;
    const accessToken = options.tmdbAccessToken
        ?? process.env['TMDB_ACCESS_TOKEN']
        ?? '';
    const tmdbApi = options.tmdbApi ?? new TmdbApiClient({
        accessToken,
        language: options.tmdbLanguage ?? process.env['TMDB_LANGUAGE'] ?? 'fr-FR',
    });
    const app = express();
    const authentication = createDemoAuthentication(options.authentication);

    const manifest = { ...createServiceManifest(authentication.manifest), logoPath: logoUrl };
    assertStreamShareService(manifest);

    app.disable('x-powered-by');
    app.use(cors());
    app.use(express.json({ limit: '64kb' }));
    app.use(express.urlencoded({ extended: true, limit: '64kb' }));
    app.use('/assets', express.static(path.join(packageRoot, 'assets')));
    authentication.registerRoutes(app);

    app.get('/', (_request, response) => {
        response.json(manifest);
    });

    app.get('/search', authentication.authorize, async (request, response, next) => {
        try {
            const result = await searchCatalog(tmdbApi, readSearch(request), mediaUrl);
            assertStreamShareResponse(result);
            response.json(result);
        } catch (error) {
            next(error);
        }
    });

    app.get('/top-rated', authentication.authorize, async (request, response, next) => {
        try {
            const result = await searchCatalog(tmdbApi, {
                type: 'movie',
                sortBy: 'rating',
                page: positiveInteger(queryValue(request, 'page'), 1),
                limit: positiveInteger(queryValue(request, 'limit'), 50),
            }, mediaUrl);
            assertStreamShareResponse(result);
            response.json(result);
        } catch (error) {
            next(error);
        }
    });

    app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
        console.error('[example-service]', error);
        const status = error instanceof TmdbApiError ? (error.status === 404 ? 404 : 502) : 500;
        response.status(status).json({ error: error instanceof Error ? error.message : 'Unexpected server error' });
    });

    return app;
}
