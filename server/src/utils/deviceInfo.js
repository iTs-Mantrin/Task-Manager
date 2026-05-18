/**
 * Extract device information from an Express request.
 * @returns {{ ipAddress: string, deviceName: string, deviceType: string, location: string, userAgent: string }}
 */
function parseDeviceInfo(req) {
  const userAgent = (req.headers['user-agent'] || '').slice(0, 500);
  const ipAddress = getClientIp(req);

  let deviceName = 'Unknown';
  let deviceType = 'unknown';

  if (userAgent) {
    const ua = userAgent.toLowerCase();

    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('android') && !ua.includes('tablet')) {
      deviceType = 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad') || ua.includes('playbook') || ua.includes('silk')) {
      deviceType = 'tablet';
    } else {
      deviceType = 'desktop';
    }

    const browser = extractBrowser(userAgent);
    const os = extractOs(userAgent);
    deviceName = os ? `${browser} on ${os}` : browser;
  }

  let location = '';
  try {
    const geo = lookupGeo(ipAddress);
    if (geo) {
      const parts = [];
      if (geo.city) parts.push(geo.city);
      if (geo.country) parts.push(geo.country);
      location = parts.join(', ');
    }
  } catch {
    // geoip lookup is best-effort
  }

  return { ipAddress, deviceName, deviceType, location, userAgent };
}

function getClientIp(req) {
  const ip = (req.ip || req.socket?.remoteAddress || '').replace(/^::ffff:/, '').slice(0, 45);
  return ip === '::1' ? '127.0.0.1' : ip;
}

function extractBrowser(ua) {
  if (ua.includes('Edg/') || ua.includes('Edge/')) return 'Edge';
  if (ua.includes('Chrome/') && !ua.includes('Edg/')) return 'Chrome';
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('OPR/') || ua.includes('Opera/')) return 'Opera';
  return 'Browser';
}

function extractOs(ua) {
  const lower = ua.toLowerCase();
  if (lower.includes('windows nt')) return 'Windows';
  if (lower.includes('mac os x') || lower.includes('macintosh')) return 'macOS';
  if (lower.includes('android')) return 'Android';
  if (lower.includes('iphone') || lower.includes('ipad') || lower.includes('ios')) return 'iOS';
  if (lower.includes('linux')) return 'Linux';
  return '';
}

/** Check if IP is in the private 172.16.0.0–172.31.255.255 range */
function isPrivate172(ip) {
  const match = ip.match(/^172\.(\d+)\./);
  if (!match) return false;
  const second = parseInt(match[1], 10);
  return second >= 16 && second <= 31;
}

function lookupGeo(ip) {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip.startsWith('192.168.') || ip.startsWith('10.') || isPrivate172(ip)) {
    return null;
  }

  try {
    const geoip = require('geoip-lite');
    return geoip.lookup(ip);
  } catch {
    return null;
  }
}

module.exports = { parseDeviceInfo };
