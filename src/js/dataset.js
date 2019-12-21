let planeDataset = null
let sliderData = null

export const getSliderData = () => new window.Promise((res) => {
  if (sliderData) {
    res(sliderData)
    return
  }

  return fetch('https://earthquake.usgs.gov/fdsnws/event/1/query.geojson?starttime=2004-12-11%2000%3A00%3A00&endtime=2011-3-18%2023%3A59%3A59&minmagnitude=7&orderby=time').then(data => data.json())
    .then(data => ({ ...data, features: data.features.filter(({ properties }) => properties.mag > 0) }))
    .then(data => {
      const magList = data.features.map(item => item.properties.mag).sort((a, b) => a - b)
      const min = magList[0]
      const max = magList.slice(-1)[0]
      return {
        data,
        size: [min, max],
      }
    })
    .then(dataset => {
      sliderData = dataset
      res(dataset)
    })
})

export const getPlaneDataset = () => new window.Promise((res) => {
  if (planeDataset) {
    res(planeDataset)
    return
  }

  return fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_month.geojson').then(data => data.json())
    .then(data => ({ ...data, features: data.features.filter(({ properties }) => properties.mag > 0) }))
    .then(data => {
      const magList = data.features.map(item => item.properties.mag).sort((a, b) => a - b)
      const min = magList[0]
      const max = magList.slice(-1)[0]
      return {
        data,
        size: [min, max],
      }
    })
    .then(dataset => {
      planeDataset = dataset
      res(dataset)
    })
})
