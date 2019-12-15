import { convertFeatureToData, parseTimeToDate } from './utils'

export const PopupContent = (geoFeature) => {
  const {
    timestamp,
    coordinates,
    magnitude,
    depth,
  } = convertFeatureToData(geoFeature)
  return `
    <div class="map-popup-container">
      <div class="u-time">
        <p>${parseTimeToDate(timestamp)}</p>
      </div>
      <div class="m-info">
        <p class="u-row">
          <span class="label">CLOSEST TO</span>
          <span class="text J_closestTo"></span>
        </p>
        <p class="u-row">
          <span class="label">LATITUDE</span>
          <span class="text">${coordinates[1]}</span>
        </p>
        <p class="u-row">
          <span class="label">LONGITUDE</span>
          <span class="text">${coordinates[0]}</span>
        </p>
        <p class="u-row">
          <span class="label">MAGNITUDE</span>
          <span class="text">${magnitude}</span>
        </p>
        <p class="u-row">
          <span class="label">DEPTH</span>
          <span class="text">${depth}</span>
        </p>
      </div>
    </div>
  `
}
