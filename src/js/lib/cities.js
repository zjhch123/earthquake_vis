import _ from 'underscore'
import cityData from './city-data.json'

const L = window.L

const db = _.map(cityData, ([name, country, latitude, longitude, population]) => ({ name, country, population, latitude, longitude, point: L.latLng(latitude, longitude) }))

function measureDirection (srcLat, srcLng, dstLat, dstLng) {
  srcLat *= Math.PI / 180
  dstLat *= Math.PI / 180
  srcLng *= Math.PI / 180
  dstLng *= Math.PI / 180
  const y = Math.sin(dstLng - srcLng) * Math.cos(dstLat)
  const x = Math.cos(srcLat) * Math.sin(dstLat) -
          Math.sin(srcLat) * Math.cos(dstLat) * Math.cos(dstLng - srcLng)
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360
}

function closestCities (lat, lng, predicate, maxDistance) {
  predicate = predicate || _.identity
  const cutoff = _.isNumber(maxDistance) ? city => city.distance <= maxDistance : _.identity
  const origin = L.latLng(lat, lng)

  const hits = _.map(_.filter(db, predicate), city => (_.extend({
    distance: origin.distanceTo(city.point) / 1000,
    direction: measureDirection(lat, lng, city.latitude, city.longitude),
  }, city)))

  return _.sortBy(_.filter(hits, cutoff), 'distance')
}

const Cities = {
  closestTo: (lat, lng, maxDist) => closestCities(lat, lng, undefined, maxDist),
  largerThan (pop) {
    return {
      closestTo: (lat, lng, maxDist) => closestCities(lat, lng, city => city.population > pop, maxDist),
    }
  },
  smallerThan (pop) {
    return {
      closestTo: (lat, lng, maxDist) => closestCities(lat, lng, city => city.population < pop, maxDist),
    }
  },
}

window.Cities = Cities
