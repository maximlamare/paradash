import igcParser from "igc-parser";
const { getStartPlaceName, getOSMPlaceName } = require("./geoOperations.js");

export async function processIGCContent(content, launchsites) {
  // Parse the IGC data
  const flightData = igcParser.parse(content);

  // Get start time
  const startTime = new Date(
    flightData.date + "T" + flightData.fixes[0].time + "Z"
  );
  const startTimeString = startTime.toLocaleTimeString("de-AT", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  // Compute flight duration
  const endTime = new Date(
    flightData.date +
      "T" +
      flightData.fixes[flightData.fixes.length - 1].time +
      "Z"
  );
  const endTimeString = endTime.toLocaleTimeString("de-AT", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const flightDuration = endTime - startTime;

  const totalMinutes = Math.round(flightDuration / 1000 / 60);

  // Convert flight duration to hh:mm format
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const flightDurationHHmm = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;

  // Extract latitude and longitude from the first fix
  const startLatitude = flightData.fixes[0].latitude;
  const startLongitude = flightData.fixes[0].longitude;

  const endLatitude = flightData.fixes[flightData.fixes.length - 1].latitude;
  const endLongitude = flightData.fixes[flightData.fixes.length - 1].longitude;

  // Get the location names
  const startLocation = getStartPlaceName(
    startLatitude,
    startLongitude,
    launchsites
  );
  const landingPlace = await getOSMPlaceName(endLatitude, endLongitude);

  // Break the start into city and country
  const startLocationArray = startLocation.split(", ");

  return {
    flightDate: flightData.date,
    flightStartTime: startTimeString,
    flightEndTime: endTimeString,
    flightDuration: flightDurationHHmm,
    flightTakeoff: startLocationArray[0],
    flightTakeoffCountryCode: startLocationArray[1],
    flightLanding: landingPlace.city,
    flightLandingCountryCode: landingPlace.countryCode,
  };
}

export async function getIGCgeoContent(IGCcontent) {
  // Parse the IGC data
  const flightData = igcParser.parse(IGCcontent);

  // Extract latitude and longitude from the first fix
  const startLatitude = flightData.fixes[0].latitude;
  const startLongitude = flightData.fixes[0].longitude;

  const endLatitude = flightData.fixes[flightData.fixes.length - 1].latitude;
  const endLongitude = flightData.fixes[flightData.fixes.length - 1].longitude;

  // Get polyline coordinates
  const polyLine = flightData.fixes.map((fix) => [fix.latitude, fix.longitude]);

  return {
    startLatitude: startLatitude,
    startLongitude: startLongitude,
    endLatitude: endLatitude,
    endLongitude: endLongitude,
    polyLine: polyLine,
  };
}
