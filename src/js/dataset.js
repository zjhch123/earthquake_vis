let planeDataset = null

export const getPlaneDataset = () => new window.Promise((res) => {
  if (planeDataset) {
    res(planeDataset)
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
