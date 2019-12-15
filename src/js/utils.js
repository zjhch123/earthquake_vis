const pad = (t) => `0${t}`.slice(-2)

export const dataScale = (original, from, to, parseToInt = false) => {
  if (original === 0) {
    return 0
  }
  const fromMin = from[0]
  const fromMax = from[1]
  const toMin = to[0]
  const toMax = to[1]

  const ret = (original - fromMin) / (fromMax - fromMin) * (toMax - toMin) + toMin

  return parseToInt ? parseInt(ret, 10) : ret
}

export const colorScale = (original, from, targetColorList) => {
  const colorCount = targetColorList.length
  const scaledData = dataScale(original, from, [0, colorCount - 1], true)

  return targetColorList[scaledData]
}

export const convertFeatureToData = ({ properties, geometry }) => ({
  timestamp: properties.time,
  coordinates: geometry.coordinates.slice(0, 2),
  magnitude: properties.mag,
  depth: geometry.coordinates[2],
})

export const parseTimeToDate = (timestamp) => {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${date.getMilliseconds()}`
}

export const parseTimeToGMTDate = (timestamp) => {
  const d = new Date(timestamp)
  const gmt = d.toGMTString()
  return `${pad(d.getHours())}:${pad(d.getMinutes())} ${gmt.split(' ').slice(2, 4).join(' ').toUpperCase()}`
}

export const isInRange = (value, bound0, bound1, isClosed = true) => {
  const left = Math.min(bound0, bound1)
  const right = Math.max(bound1, bound0)

  return (isClosed
    ? value >= left && value <= right
    : value > left && value < right)
}
