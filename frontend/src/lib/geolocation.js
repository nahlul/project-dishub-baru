// Robust wrapper around navigator.geolocation.
//
// Fixes the common "Tidak dapat menentukan lokasi Anda" failures:
//  - Requires a secure context (HTTPS or localhost); browsers silently block
//    geolocation on plain http:// over a LAN IP, which surfaces as an error.
//  - High-accuracy GPS often TIMEOUTs on desktops/indoors, so we retry with
//    low accuracy and allow a slightly cached fix before giving up.
//  - Returns clear, distinct Indonesian messages per error code.

export const isSecureGeolocationContext = () => {
  if (typeof window === 'undefined') return false;
  // window.isSecureContext is true for https:// and for localhost/127.0.0.1.
  if (window.isSecureContext) return true;
  const host = window.location?.hostname || '';
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
};

const messageForError = (err) => {
  if (!err) return 'Tidak dapat menentukan lokasi Anda. Coba lagi.';
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return 'Izin lokasi ditolak. Aktifkan izin lokasi di peramban untuk memakai fitur ini.';
    case err.POSITION_UNAVAILABLE:
      return 'Lokasi tidak tersedia saat ini. Pastikan GPS/layanan lokasi perangkat aktif, lalu coba lagi.';
    case err.TIMEOUT:
      return 'Waktu penentuan lokasi habis. Coba lagi di area dengan sinyal lebih baik.';
    default:
      return 'Tidak dapat menentukan lokasi Anda. Coba lagi.';
  }
};

/**
 * Resolve the user's current position, retrying with progressively looser
 * options. Rejects with an Error whose `.message` is a user-facing string and
 * whose `.code` mirrors the GeolocationPositionError code (or 'INSECURE' /
 * 'UNSUPPORTED').
 */
export const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      const e = new Error('Peramban Anda tidak mendukung layanan lokasi.');
      e.code = 'UNSUPPORTED';
      return reject(e);
    }
    if (!isSecureGeolocationContext()) {
      const e = new Error(
        'Lokasi hanya dapat diakses lewat koneksi aman (HTTPS) atau localhost. ' +
          'Buka situs melalui https:// atau http://localhost, lalu coba lagi.'
      );
      e.code = 'INSECURE';
      return reject(e);
    }

    const success = (pos) => resolve(pos);

    // Second attempt: low accuracy, longer timeout, allow a recent cached fix.
    const retryLowAccuracy = (firstErr) => {
      if (firstErr && firstErr.code === firstErr.PERMISSION_DENIED) {
        const e = new Error(messageForError(firstErr));
        e.code = firstErr.code;
        return reject(e);
      }
      navigator.geolocation.getCurrentPosition(
        success,
        (err) => {
          const e = new Error(messageForError(err));
          e.code = err.code;
          reject(e);
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
      );
    };

    // First attempt: high accuracy, reasonable timeout.
    navigator.geolocation.getCurrentPosition(success, retryLowAccuracy, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 30000,
    });
  });
