import igcParser from "igc-parser";
const { getDHVStartPlaceName, getOSMPlaceName } = require("./geoOperations.js");

export async function processIGCContent(content) {
  // Parse the IGC data
  const flightData = igcParser.parse(content);

  // Compute flight duration
  const startDateTime = new Date(
    flightData.date + "T" + flightData.fixes[0].time
  );
  const endDateTime = new Date(
    flightData.date + "T" + flightData.fixes[flightData.fixes.length - 1].time
  );
  const flightDuration = endDateTime - startDateTime;
  const totalMinutes = Math.round(flightDuration / 1000 / 60);
  // Convert flight duration to hh:mm format
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const flightDurationHHmm = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

  // Extract latitude and longitude from the first fix
  const startLatitude = flightData.fixes[0].latitude;
  const startLongitude = flightData.fixes[0].longitude;
  const endLatitude = flightData.fixes[flightData.fixes.length - 1].latitude;
  const endLongitude = flightData.fixes[flightData.fixes.length - 1].longitude;

  // Get the location names
  const start = await getDHVStartPlaceName(startLatitude, startLongitude);
  const landingPlace = await getOSMPlaceName(endLatitude, endLongitude);

  // Convert end location to a string with city and country
  const startLocation = `${start.Name}, ${start.Country}`;
  const endLocation = `${landingPlace.city}, ${landingPlace.country}`;

  return {
    flightDate: flightData.date,
    flightDuration: flightDurationHHmm,
    flightTakeoff: startLocation,
    flightLanding: endLocation,
  };
}
