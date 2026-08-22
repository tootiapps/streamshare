export const STREAMSHARE_REMOTE_PROTOCOL_VERSION = 1 as const;
export const STREAMSHARE_REMOTE_SERVICE_TYPE = '_streamshare-tv._tcp.local.' as const;
export const STREAMSHARE_REMOTE_SERVICE_NAME = 'streamshare-tv' as const;
export const STREAMSHARE_REMOTE_API_PATH = '/v1' as const;

export type RemotePlatform = 'android' | 'windows' | 'macos' | 'linux';

export type RemoteCapability =
  | 'play'
  | 'pause'
  | 'stop'
  | 'seek'
  | 'volume'
  | 'audio'
  | 'subtitles'
  | 'video'
  | 'navigation';

export interface RemoteReceiver {
  id: string;
  name: string;
  host: string;
  port: number;
  platform: RemotePlatform;
  protocolVersion: typeof STREAMSHARE_REMOTE_PROTOCOL_VERSION;
  capabilities: RemoteCapability[];
  paired: boolean;
  /** Monotonic timestamp of the receiver announcement configuration. */
  announcementUpdatedAt?: number;
}

export interface RemoteController {
  id: string;
  name: string;
  createdAt: number;
  lastSeenAt: number;
}

export type RemotePlaybackStatus =
  | 'idle'
  | 'buffering'
  | 'playing'
  | 'paused'
  | 'ended'
  | 'error';

export interface RemoteMediaMetadata {
  title?: string;
  subtitle?: string;
  releaseYear?: number;
  overview?: string;
  artworkUrl?: string;
  contentType?: string;
  /** Sender-owned opaque values that receivers must preserve without interpreting. */
  customData?: Record<string, unknown>;
}

export type RemoteTrackType = 'audio' | 'video' | 'subtitle';

export interface RemoteMediaTrack {
  /** Receiver-owned stable identifier for the current playback session. */
  id: string;
  type: RemoteTrackType;
  label: string;
  language?: string;
  codec?: string;
  bitrate?: number;
  width?: number;
  height?: number;
  selected: boolean;
  supported: boolean;
}

export interface RemoteMediaTracks {
  audio: RemoteMediaTrack[];
  video: RemoteMediaTrack[];
  subtitles: RemoteMediaTrack[];
}

export interface RemotePlaybackUiState {
  controlsVisible: boolean;
  panel?: 'tracks';
  focusedControl?: string;
}

export interface RemotePlaybackState {
  sessionId?: string;
  status: RemotePlaybackStatus;
  positionMs: number;
  durationMs: number;
  volume: number;
  muted: boolean;
  metadata?: RemoteMediaMetadata;
  tracks?: RemoteMediaTracks;
  ui?: RemotePlaybackUiState;
  error?: string;
  revision: number;
}

export interface LoadMediaParams {
  url: string;
  metadata?: RemoteMediaMetadata;
  startPositionMs?: number;
  autoplay?: boolean;
  headers?: Record<string, string>;
}

export interface PairBeginParams {
  controllerId: string;
  controllerName: string;
}

export interface PairBeginResult {
  pairingId: string;
  receiverFingerprint: string;
  expiresAt: number;
}

export interface PairCompleteParams {
  pairingId: string;
  controllerId: string;
  controllerName: string;
  encryptedToken: string;
}

export interface PairCompleteResult {
  controller: RemoteController;
}

export interface RemoteMethodParams {
  'pair.begin': PairBeginParams;
  'pair.complete': PairCompleteParams;
  'playback.load': LoadMediaParams;
  'playback.play': Record<string, never>;
  'playback.pause': Record<string, never>;
  'playback.stop': Record<string, never>;
  'playback.seek': { positionMs: number };
  'playback.volume': { volume: number };
  'playback.selectTrack': { type: RemoteTrackType; trackId: string };
  'playback.getState': Record<string, never>;
  'ui.navigate': { action: 'up' | 'down' | 'left' | 'right' | 'select' | 'back' };
}

export interface RemoteMethodResult {
  'pair.begin': PairBeginResult;
  'pair.complete': PairCompleteResult;
  'playback.load': RemotePlaybackState;
  'playback.play': RemotePlaybackState;
  'playback.pause': RemotePlaybackState;
  'playback.stop': RemotePlaybackState;
  'playback.seek': RemotePlaybackState;
  'playback.volume': RemotePlaybackState;
  'playback.selectTrack': RemotePlaybackState;
  'playback.getState': RemotePlaybackState;
  'ui.navigate': RemotePlaybackState;
}

export type RemoteMethod = keyof RemoteMethodParams;

export interface RemoteRequest<M extends RemoteMethod = RemoteMethod> {
  v: typeof STREAMSHARE_REMOTE_PROTOCOL_VERSION;
  type: 'request';
  id: string;
  method: M;
  params: RemoteMethodParams[M];
}

export interface RemoteSuccessResponse<M extends RemoteMethod = RemoteMethod> {
  v: typeof STREAMSHARE_REMOTE_PROTOCOL_VERSION;
  type: 'response';
  id: string;
  ok: true;
  result: RemoteMethodResult[M];
}

export interface RemoteError {
  code:
    | 'INVALID_REQUEST'
    | 'UNAUTHORIZED'
    | 'PAIRING_REQUIRED'
    | 'PAIRING_EXPIRED'
    | 'UNSUPPORTED_VERSION'
    | 'UNSUPPORTED_MEDIA'
    | 'PLAYER_ERROR'
    | 'INTERNAL_ERROR';
  message: string;
  retryable?: boolean;
}

export interface RemoteErrorResponse {
  v: typeof STREAMSHARE_REMOTE_PROTOCOL_VERSION;
  type: 'response';
  id: string;
  ok: false;
  error: RemoteError;
}

export interface RemoteStateEvent {
  v: typeof STREAMSHARE_REMOTE_PROTOCOL_VERSION;
  type: 'event';
  event: 'playback.state';
  data: RemotePlaybackState;
}

export type RemoteResponse<M extends RemoteMethod = RemoteMethod> =
  | RemoteSuccessResponse<M>
  | RemoteErrorResponse;

export type RemoteEnvelope = RemoteRequest | RemoteResponse | RemoteStateEvent;

const methods = new Set<RemoteMethod>([
  'pair.begin',
  'pair.complete',
  'playback.load',
  'playback.play',
  'playback.pause',
  'playback.stop',
  'playback.seek',
  'playback.volume',
  'playback.selectTrack',
  'playback.getState',
  'ui.navigate'
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isRemoteEnvelope(value: unknown): value is RemoteEnvelope {
  if (!isRecord(value) || value.v !== STREAMSHARE_REMOTE_PROTOCOL_VERSION || typeof value.type !== 'string') {
    return false;
  }

  if (value.type === 'request') {
    return typeof value.id === 'string'
      && typeof value.method === 'string'
      && methods.has(value.method as RemoteMethod)
      && isRecord(value.params);
  }

  if (value.type === 'response') {
    if (typeof value.id !== 'string' || typeof value.ok !== 'boolean') {
      return false;
    }
    return value.ok ? 'result' in value : isRecord(value.error);
  }

  return value.type === 'event'
    && value.event === 'playback.state'
    && isRecord(value.data);
}

export function parseRemoteEnvelope(json: string): RemoteEnvelope {
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    throw new TypeError('Remote message is not valid JSON');
  }
  if (!isRemoteEnvelope(value)) {
    throw new TypeError('Remote message does not match protocol v1');
  }
  return value;
}

export function createRemoteRequest<M extends RemoteMethod>(
  id: string,
  method: M,
  params: RemoteMethodParams[M]
): RemoteRequest<M> {
  if (!id.trim()) {
    throw new TypeError('Request id must not be empty');
  }
  return {
    v: STREAMSHARE_REMOTE_PROTOCOL_VERSION,
    type: 'request',
    id,
    method,
    params
  };
}

export async function derivePairingCode(
  receiverFingerprint: string,
  pairingId: string,
  controllerId: string
): Promise<string> {
  const input = new TextEncoder().encode(`${receiverFingerprint}:${pairingId}:${controllerId}`);
  const digest = new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', input));
  const value = (((digest[0] << 8) | digest[1]) % 100);
  return String(value).padStart(2, '0');
}
