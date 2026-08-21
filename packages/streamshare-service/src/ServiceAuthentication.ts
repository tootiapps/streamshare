/** Authentication supported by a StreamShare service. */
export type ServiceAuthentication =
    | BasicServiceAuthentication
    | ApiKeyServiceAuthentication
    | DeviceCodeServiceAuthentication;

/** HTTP Basic authentication using credentials entered by the user. */
export interface BasicServiceAuthentication {
    method: 'basic';
}

/** A static user-provided key sent as a Bearer token. */
export interface ApiKeyServiceAuthentication {
    method: 'apikey';
}

/**
 * Device-code authentication suitable for televisions and other devices where
 * signing in from a second device is more convenient.
 */
export interface DeviceCodeServiceAuthentication {
    method: 'deviceCode';
    /** Relative path that creates a short-lived authorization challenge. */
    deviceAuthorizationPath: string;
    /** Relative path used both to poll authorization and refresh tokens. */
    tokenPath: string;
}

/** Challenge returned when a client starts device-code authentication. */
export interface ServiceDeviceAuthorization {
    /** Opaque value sent only to the token endpoint. */
    deviceCode: string;
    /** Short value displayed to the user. */
    userCode: string;
    /** Page where the user can enter the code. */
    verificationUrl: string;
    /** Optional page containing the code, suitable for links and QR codes. */
    verificationUrlComplete?: string;
    /** Challenge lifetime in seconds. */
    expiresIn: number;
    /** Minimum polling interval in seconds. */
    interval: number;
}

/** Request used to poll a device-code authorization. */
export interface ServiceDeviceTokenRequest {
    grantType: 'urn:ietf:params:oauth:grant-type:device_code';
    deviceCode: string;
}

/** Request used to renew an authenticated service session. */
export interface ServiceRefreshTokenRequest {
    grantType: 'refresh_token';
    refreshToken: string;
}

/** Bearer tokens returned after authorization or renewal. */
export interface ServiceTokenGrant {
    accessToken: string;
    refreshToken: string;
    /** Access-token lifetime in seconds. */
    expiresIn: number;
}

/** Result returned while polling the token endpoint. */
export type ServiceDeviceTokenResponse =
    | { status: 'pending'; interval?: number }
    | { status: 'denied' | 'expired' }
    | ({ status: 'authorized' } & ServiceTokenGrant);
