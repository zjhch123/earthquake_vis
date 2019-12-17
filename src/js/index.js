import $ from 'jquery'
import _ from 'underscore'
import Fullpage from 'fullpage.js'
import { dataScale, colorScale, convertFeatureToData, isInRange } from './utils'
import { PopupContent } from './popup-content'
import { renderFrequency, renderMagnitude, renderDepth } from './graph'
import { getPlaneDataset } from './dataset'

import 'fullpage.js/dist/fullpage.css'
import './lib/cities'

const colorList = [
  '#34B6B7',
  '#4AC5AF',
  '#5FD3A6',
  '#7BE39E',
  '#A1EDB8',
  '#CEF8D6',
]

const L = window.L

let map = null
let fullpageInst = null

const launchMap = (() => {
  let pointLayer = null
  let lineLayer = null
  let cityCircleLayer = null
  let popupLayer = null
  let lastClickFeatureId = null
  let clickCount = 0
  let clickTriggerFromPoint = false

  map = L.map('map').setView([8, 17], 3)
  L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiempoY2gxMjMiLCJhIjoiY2l1cDd4cWduMDAzMDJvbDhrY2Zta3NkNCJ9.3FmRDWqp0TXkgdDIWnM-vw', {
    maxZoom: 10,
    minZoom: 2,
    id: 'mapbox/dark-v10',
  }).addTo(map)

  const initPointClick = () => {
    hideLine()
    hidePopup()
    lastClickFeatureId = null
    clickCount = 0
  }

  const showPopup = (feature) => {
    const { geometry } = feature
    const latlng = [geometry.coordinates[1], geometry.coordinates[0]]
    popupLayer = L.popup({
      closeButton: false,
      className: 'map-popup',
      minWidth: '194',
      maxWidth: '194',
      autoClose: false,
    }).setContent(PopupContent(feature))
      .setLatLng(latlng)
      .openOn(map)
  }

  const hidePopup = () => {
    popupLayer && map.removeLayer(popupLayer)
  }

  const showLine = (from, to) => {
    lineLayer = L.polyline([from, to], {
      color: '#CA8802',
      pane: 'tilePane',
    }).addTo(map)
    cityCircleLayer = L.circle(to, {
      radius: 5000,
      color: '#CA8802',
      fill: true,
      fillColor: '#CA8802',
      fillOpacity: 1,
    }).addTo(map)
  }

  const hideLine = () => {
    lineLayer && map.removeLayer(lineLayer)
    cityCircleLayer && map.removeLayer(cityCircleLayer)
  }

  const getFilter = (filterObject) => {
    let filter = () => true
    if (_.isObject(filterObject)) {
      switch (filterObject.type) {
        case 'timestamp':
          filter = ({ properties: { time } }) => isInRange(time, filterObject.range[0], filterObject.range[1], true)
          break
        case 'magnitude':
          filter = ({ properties: { mag } }) => isInRange(mag, filterObject.range[0][0], filterObject.range[1][1], true)
          break
        case 'depth':
          filter = ({ geometry: { coordinates } }) => isInRange(coordinates[2], filterObject.range[0][0], filterObject.range[1][1], true)
          break
        default:
          filter = () => true
          break
      }
    }

    return filter
  }

  map.on('popupopen', (ev) => {
    const { lat, lng } = ev.popup._latlng
    $('.J_closestTo').text(window.Cities.closestTo(lat, lng)[0].name)
  })

  map.on('click', () => {
    if (clickTriggerFromPoint) {
      clickTriggerFromPoint = false
      return
    }
    initPointClick()
  })

  return ({ data, size }, filterObject) => {
    if (pointLayer) {
      map.removeLayer(pointLayer)
    }

    initPointClick()

    pointLayer = L.geoJSON(data, {
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, {
          radius: dataScale(feature.properties.mag, size, [0, 16]),
          fillColor: colorScale(feature.properties.mag, size, colorList),
          stroke: false,
          fillOpacity: 0.5,
        })
      },
      filter: getFilter(filterObject),
    })

    pointLayer.addEventListener('click', (e) => {
      clickTriggerFromPoint = true
      const { layer } = e
      const { feature } = layer
      const { geometry } = feature
      const id = feature.id
      const pointLatlngArray = [geometry.coordinates[1], geometry.coordinates[0]]
      const city = window.Cities.closestTo(...pointLatlngArray)[0]
      const cityLatlngArray = [city.point.lat, city.point.lng]

      if (id !== lastClickFeatureId) {
        clickCount = 0
        lastClickFeatureId = id
        hideLine()
      }

      clickCount += 1

      switch (clickCount) {
        case 1:
          showLine(pointLatlngArray, cityLatlngArray)
          break
        case 2:
          showPopup(feature)
          break
        default:
          initPointClick()
          break
      }
    })

    pointLayer.addTo(map)
  }
})()

const launchGraph = ({ data }, filterObject) => {
  const parsedData = data.features.map(feature => convertFeatureToData(feature))
  let graphs = [renderFrequency, renderMagnitude, renderDepth]
  let filterFunc = () => true

  if (_.isObject(filterObject)) {
    switch (filterObject.type) {
      case 'timestamp':
        graphs = [renderMagnitude, renderDepth]
        filterFunc = ({ timestamp }) => isInRange(timestamp, filterObject.range[0], filterObject.range[1], true)
        break
      case 'magnitude':
        graphs = [renderFrequency, renderDepth]
        filterFunc = ({ magnitude }) => isInRange(magnitude, filterObject.range[0][0], filterObject.range[1][1], true)
        break
      case 'depth':
        graphs = [renderFrequency, renderMagnitude]
        filterFunc = ({ depth }) => isInRange(depth, filterObject.range[0][0], filterObject.range[1][1], true)
        break
      default: graphs = []; break
    }
  }

  const filteredData = parsedData.filter(filterFunc)

  graphs.forEach(render => render(filteredData))
}

const listen = () => {
  $('.J_display').on('click', () => {
    if ($('.J_control').hasClass('f-hide')) {
      $('.J_control').removeClass('f-hide')
    } else {
      $('.J_control').addClass('f-hide')
    }
  })

  $('.J_replay').on('click', () => {
    fullpageInst.moveTo(1)
  })

  $('.J_discover').on('click', () => {
    $('#app_start').hide()
    $('.J_inner_container').removeClass('f-fixed')
    $('.J_control').removeClass('f-hide')
  })

  $(window).on('filter', (_, filterObject) => {
    getPlaneDataset().then(dataset => {
      launchMap(dataset, filterObject)
      launchGraph(dataset, filterObject)
    })
    window.IS_FILTERING = true
  })

  $(window).on('reset-filter', (_, source) => {
    getPlaneDataset().then(dataset => {
      launchMap(dataset)
      launchGraph(dataset, undefined, source)
    })
    window.IS_FILTERING = false
  })
}

const launchFullpage = () => {
  $('.J_slider').each((index, dom) => {
    $(dom).attr('src', window.config.sliders[index].image)
  })

  fullpageInst = new Fullpage('#app_start', {
    autoScrolling: true,
    scrollHorizontally: true,
    licenseKey: 'dddddddd-dddddddd-dddddddd-dddddddd',
    onLeave: (from, { index }) => {
      if (index < 1 || index > 3) { return }
      const { latlng, zoom } = window.config.sliders[index - 1]
      map.flyTo(latlng, zoom)
    },
  })
  window.f = fullpageInst
}

const start = () => {
  listen()
  getPlaneDataset().then(dataset => {
    launchMap(dataset)
    launchGraph(dataset)
  })
  launchFullpage()
}

start()
