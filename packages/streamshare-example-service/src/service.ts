import { defineService, type ServiceAuthentication } from '@streamshare/service';

export function createServiceManifest(auth?: ServiceAuthentication) {
    return defineService({
    protocolVersion: 1,
    name: 'StreamShare example service',
    description: 'Stateless TMDB-backed reference implementation of the StreamShare HTTP service protocol.',
    ...(auth ? { auth } : {}),
    api: [
        {
            id: 'search',
            kind: 'search',
            label: 'Search',
            method: 'GET',
            pathname: '/search',
            params: [
                { id: 'q', role: 'query', label: 'Keyword', description: 'Title search', type: 'text' },
                {
                    id: 'mediaType',
                    role: 'mediaType',
                    label: 'Type',
                    description: 'Media type',
                    type: 'select',
                    options: [
                        { label: 'Movie', value: 'movie' },
                        { label: 'Series', value: 'series' },
                        { label: 'Season', value: 'season' },
                        { label: 'Episode', value: 'episode' },
                    ],
                },
                { id: 'tmdbId', role: 'tmdbId', label: 'TMDB ID', type: 'text', hidden: true },
                { id: 'genre', role: 'genre', label: 'TMDB genre ID', type: 'text' },
                { id: 'year', role: 'year', label: 'Year', type: 'text' },
                { id: 'season', role: 'season', label: 'Season', type: 'text', hidden: true },
                { id: 'episode', role: 'episode', label: 'Episode', type: 'text', hidden: true },
                {
                    id: 'sortBy',
                    role: 'sort',
                    label: 'Sort by',
                    type: 'select',
                    options: [
                        { label: 'Most recent', value: 'date' },
                        { label: 'Title', value: 'title' },
                        { label: 'Top rated', value: 'rating' },
                        { label: 'Popularity', value: 'popularity' },
                    ],
                },
                { id: 'page', role: 'page', label: 'Page', type: 'text', hidden: true },
                { id: 'limit', role: 'limit', label: 'Limit', type: 'text', hidden: true },
            ],
        },
        {
            id: 'top-rated',
            kind: 'browse',
            label: 'Top rated',
            method: 'GET',
            pathname: '/top-rated',
            params: [],
        },
    ],
    });
}

export const serviceManifest = createServiceManifest();
