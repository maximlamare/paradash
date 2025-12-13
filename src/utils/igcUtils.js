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
export function haversineDistance(lat1, lon1, lat2, lon2) {
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

/**
 * Calculate free-flight distance from IGC file content
 * Free distance is the greatest possible distance using up to 5 points:
 * one start point, up to three turnpoints, and one finish point.
 * The algorithm finds the optimal combination of points that yields maximum distance.
 * 
 * @param {string} igcContent - Full IGC file content
 * @returns {object} Object with freeDistance in kilometers and the optimal turnpoints
 */
export function calculateFreeFlightDistance(igcContent) {
  const lines = igcContent.split("\n");
  const trackPoints = [];

  // Parse all B-records (position fixes)
  for (const line of lines) {
    if (line.startsWith("B")) {
      const point = parseBRecord(line);
      if (point) {
        trackPoints.push(point);
      }
    }
  }

  if (trackPoints.length < 2) {
    return { freeDistance: 0, turnpoints: [] };
  }

  // For efficiency, sample the track if it has too many points
  // We'll use a maximum of ~200 sample points for the optimization
  const maxSamplePoints = 200;
  let sampledPoints = trackPoints;
  
  if (trackPoints.length > maxSamplePoints) {
    const sampleRate = Math.ceil(trackPoints.length / maxSamplePoints);
    sampledPoints = trackPoints.filter((_, index) => index % sampleRate === 0);
    // Always include the last point
    if (sampledPoints[sampledPoints.length - 1] !== trackPoints[trackPoints.length - 1]) {
      sampledPoints.push(trackPoints[trackPoints.length - 1]);
    }
  }

  const n = sampledPoints.length;
  
  // Precompute distance matrix for efficiency
  const distMatrix = [];
  for (let i = 0; i < n; i++) {
    distMatrix[i] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) {
        distMatrix[i][j] = 0;
      } else if (j < i) {
        distMatrix[i][j] = distMatrix[j][i];
      } else {
        distMatrix[i][j] = haversineDistance(
          sampledPoints[i].lat, sampledPoints[i].lon,
          sampledPoints[j].lat, sampledPoints[j].lon
        );
      }
    }
  }

  // Find the optimal 5-point route (start, tp1, tp2, tp3, finish)
  // Points must be in order along the track (indices must be increasing)
  // We try all combinations: 2 points, 3 points, 4 points, and 5 points
  
  let maxDistance = 0;
  let bestPoints = [];

  // Helper function to calculate total distance for a set of point indices
  const calcTotalDistance = (indices) => {
    let total = 0;
    for (let i = 1; i < indices.length; i++) {
      total += distMatrix[indices[i - 1]][indices[i]];
    }
    return total;
  };

  // Try 2-point combinations (just start and finish - same as straight distance)
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const dist = distMatrix[i][j];
      if (dist > maxDistance) {
        maxDistance = dist;
        bestPoints = [i, j];
      }
    }
  }

  // Try 3-point combinations (start, 1 turnpoint, finish)
  for (let i = 0; i < n - 2; i++) {
    for (let j = i + 1; j < n - 1; j++) {
      for (let k = j + 1; k < n; k++) {
        const dist = calcTotalDistance([i, j, k]);
        if (dist > maxDistance) {
          maxDistance = dist;
          bestPoints = [i, j, k];
        }
      }
    }
  }

  // Try 4-point combinations (start, 2 turnpoints, finish)
  // Use step-based optimization for efficiency
  const step4 = n > 50 ? Math.ceil(n / 50) : 1;
  for (let i = 0; i < n - 3; i += step4) {
    for (let j = i + 1; j < n - 2; j += step4) {
      for (let k = j + 1; k < n - 1; k += step4) {
        for (let l = k + 1; l < n; l += step4) {
          const dist = calcTotalDistance([i, j, k, l]);
          if (dist > maxDistance) {
            maxDistance = dist;
            bestPoints = [i, j, k, l];
          }
        }
      }
    }
  }

  // Try 5-point combinations (start, 3 turnpoints, finish)
  // Use coarser step for initial search, then refine
  const step5 = n > 40 ? Math.ceil(n / 40) : 1;
  for (let i = 0; i < n - 4; i += step5) {
    for (let j = i + 1; j < n - 3; j += step5) {
      for (let k = j + 1; k < n - 2; k += step5) {
        for (let l = k + 1; l < n - 1; l += step5) {
          for (let m = l + 1; m < n; m += step5) {
            const dist = calcTotalDistance([i, j, k, l, m]);
            if (dist > maxDistance) {
              maxDistance = dist;
              bestPoints = [i, j, k, l, m];
            }
          }
        }
      }
    }
  }

  // Local refinement: try nearby points for the best solution found
  if (bestPoints.length > 0 && step5 > 1) {
    const refinementRange = step5 * 2;
    let improved = true;
    
    while (improved) {
      improved = false;
      const currentBest = [...bestPoints];
      
      for (let pointIdx = 0; pointIdx < currentBest.length; pointIdx++) {
        const originalIdx = currentBest[pointIdx];
        const minIdx = pointIdx === 0 ? 0 : currentBest[pointIdx - 1] + 1;
        const maxIdx = pointIdx === currentBest.length - 1 ? n - 1 : currentBest[pointIdx + 1] - 1;
        
        for (let newIdx = Math.max(minIdx, originalIdx - refinementRange); 
             newIdx <= Math.min(maxIdx, originalIdx + refinementRange); 
             newIdx++) {
          if (newIdx === originalIdx) continue;
          
          const testPoints = [...currentBest];
          testPoints[pointIdx] = newIdx;
          const dist = calcTotalDistance(testPoints);
          
          if (dist > maxDistance) {
            maxDistance = dist;
            bestPoints = [...testPoints];
            improved = true;
          }
        }
      }
    }
  }

  // Extract the actual turnpoints (excluding start and finish)
  const turnpoints = bestPoints.slice(1, -1).map(idx => ({
    lat: sampledPoints[idx].lat,
    lon: sampledPoints[idx].lon,
    index: idx
  }));

  return {
    freeDistance: Math.round(maxDistance * 100) / 100,
    turnpoints: turnpoints,
    startPoint: bestPoints.length > 0 ? {
      lat: sampledPoints[bestPoints[0]].lat,
      lon: sampledPoints[bestPoints[0]].lon
    } : null,
    finishPoint: bestPoints.length > 0 ? {
      lat: sampledPoints[bestPoints[bestPoints.length - 1]].lat,
      lon: sampledPoints[bestPoints[bestPoints.length - 1]].lon
    } : null
  };
}

