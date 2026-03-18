export interface GeoPayload {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  capturedAt: string;
  meta: { mocked: boolean };
}

export const captureLocation = (): Promise<GeoPayload> =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? undefined,
          altitude: pos.coords.altitude ?? undefined,
          altitudeAccuracy: pos.coords.altitudeAccuracy ?? undefined,
          heading: pos.coords.heading ?? undefined,
          speed: pos.coords.speed ?? undefined,
          capturedAt: new Date(pos.timestamp).toISOString(),
          meta: { mocked: false },
        });
      },
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });

/**
 * Requests geolocation permission and returns the current status.
 * Returns 'granted' | 'denied' | 'prompt'.
 */
export const requestLocationPermission = async (): Promise<PermissionState> => {
  if (!navigator.permissions) return 'prompt';
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    if (result.state === 'prompt') {
      // Trigger the prompt by calling getCurrentPosition
      await captureLocation().catch(() => {});
      return (await navigator.permissions.query({ name: 'geolocation' })).state;
    }
    return result.state;
  } catch {
    return 'prompt';
  }
};
