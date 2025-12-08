/**
 * Parse IGC file and calculate distances
 */

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1 in degrees
 * @param {number} lon1 - Longitude of point 1 in degrees
 * @param {number} lat2 - Latitude of point 2 in degrees
 * @param {number} lon2 - Longitude of point 2 in degrees
 * @returns {number} Distance in kilometers
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number} radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Parse IGC coordinate format to decimal degrees
 * IGC format: DDMMmmm for latitude, DDDMMmmm for longitude
 * @param {string} coord - Coordinate string from IGC (without hemisphere)
 * @param {string} hemisphere - N/S for latitude, E/W for longitude
 * @returns {number} Decimal degrees
 */
function parseIGCCoordinate(coord, hemisphere) {
  const isLat = hemisphere === "N" || hemisphere === "S";
  const degreeDigits = isLat ? 2 : 3;

  const degrees = parseInt(coord.substring(0, degreeDigits));
  const minutesStr = coord.substring(degreeDigits);
  // Parse minutes with 3 decimal places (MMmmm format)
  const minutes =
    parseInt(minutesStr.substring(0, 2)) +
    parseInt(minutesStr.substring(2)) / 1000;

  let decimal = degrees + minutes / 60;

  // Apply sign for southern/western hemispheres
  if (hemisphere === "S" || hemisphere === "W") {
    decimal = -decimal;
  }

  return decimal;
}

/**
 * Parse IGC B-record (position fix)
 * Format: B HHMMSS DDMMmmmN DDDMMmmmE V PPPPP GGGGG
 * PPPPP = pressure altitude (meters)
 * GGGGG = GPS altitude (meters)
 * @param {string} line - IGC B-record line
 * @returns {object|null} Parsed position data or null if invalid
 */
function parseBRecord(line) {
  if (!line.startsWith("B") || line.length < 35) {
    return null;
  }

  try {
    const lat = parseIGCCoordinate(line.substring(7, 14), line.charAt(14));
    const lon = parseIGCCoordinate(line.substring(15, 23), line.charAt(23));
    const pressureAlt = parseInt(line.substring(25, 30));
    const gpsAlt = parseInt(line.substring(30, 35));

    return { lat, lon, pressureAlt, gpsAlt };
  } catch (error) {
    console.error("Error parsing B-record:", error);
    return null;
  }
}

/**
 * Calculate track distance and straight line distance from IGC file content
 * @param {string} igcContent - Full IGC file content
 * @returns {object} Object with trackDistance, straightDistance in kilometers, and maxAltitude in meters
 */
export function calculateIGCDistances(igcContent) {
  const lines = igcContent.split("\n");
  const trackPoints = [];
  let maxAltitude = 0;

  // Parse all B-records (position fixes)
  for (const line of lines) {
    if (line.startsWith("B")) {
      const point = parseBRecord(line);
      if (point) {
        trackPoints.push(point);
        // Use GPS altitude if available, otherwise use pressure altitude
        const altitude = point.gpsAlt > 0 ? point.gpsAlt : point.pressureAlt;
        if (altitude > maxAltitude) {
          maxAltitude = altitude;
        }
      }
    }
  }

  if (trackPoints.length < 2) {
    return { trackDistance: 0, straightDistance: 0, maxAltitude: 0 };
  }

  // Calculate track distance (sum of all segments)
  let trackDistance = 0;
  for (let i = 1; i < trackPoints.length; i++) {
    const prev = trackPoints[i - 1];
    const curr = trackPoints[i];
    trackDistance += haversineDistance(prev.lat, prev.lon, curr.lat, curr.lon);
  }

  // Calculate straight line distance (takeoff to landing)
  const first = trackPoints[0];
  const last = trackPoints[trackPoints.length - 1];
  const straightDistance = haversineDistance(
    first.lat,
    first.lon,
    last.lat,
    last.lon
  );

  return {
    trackDistance: Math.round(trackDistance * 100) / 100, // Round to 2 decimal places
    straightDistance: Math.round(straightDistance * 100) / 100,
    maxAltitude: maxAltitude, // In meters
  };
}

