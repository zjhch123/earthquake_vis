import $ from 'jquery'
import _ from 'underscore'
import { dataScale, isInRange } from '../utils'
import P5 from 'p5'
import 'p5.js-svg'

const targetDOMId = '#frequency'
let p5inst = null

const draw = (data) => {
  const sortedByCount = data.slice(0).sort((a, b) => a.count - b.count)
  const minCount = _.first(sortedByCount).count
  const maxCount = _.last(sortedByCount).count

  const $dom = $(targetDOMId)
  const domWidth = $dom.width()
  const domHeight = $dom.height()
  const paddingLeftRight = 17 // 左坐标轴顶端到dom左边的距离
  const paddingTopBottom = 22 // 左坐标轴顶端到dom顶部的距离
  const innerPaddingLeftRight = 5 // 柱状图到坐标轴的间距

  const coordBarWidth = 3 // 坐标轴的宽度
  const graphHeight = 104

  const graphWidth = domWidth - paddingLeftRight * 2 - 2 * coordBarWidth
  const dataCount = data.length
  const barWidth = (graphWidth - 2 * innerPaddingLeftRight) / dataCount * 0.7 // 柱状图柱宽度 # HACK
  const barSplitWidth = (graphWidth - 2 * innerPaddingLeftRight - dataCount * barWidth) / (dataCount - 1) // 柱状图柱间距

  const inst = (sketch) => {
    let isDrawing = false
    let drawStartPosition = [0, 0]
    let selectedTimestamps = []

    sketch.setup = () => {
      sketch.createCanvas(domWidth, domHeight, sketch.SVG)
      sketch.frameRate(60)
    }

    sketch.draw = () => {
      sketch.clear()

      sketch.push()
      sketch.fill('#D8D8D8')
      sketch.noStroke()
      sketch.translate(paddingLeftRight, paddingTopBottom)

      // 坐标轴
      sketch.rect(0, 0, coordBarWidth, graphHeight)
      sketch.rect(graphWidth + coordBarWidth, 0, coordBarWidth, graphHeight)
      sketch.rect(coordBarWidth, graphHeight - coordBarWidth, graphWidth, coordBarWidth)

      for (let i = 0; i < dataCount; i++) {
        const { date, count, timestamp } = data[i]

        const value = dataScale(count, [minCount, maxCount], [graphHeight * 0.1, graphHeight * 0.9])

        const x = coordBarWidth + innerPaddingLeftRight + i * barSplitWidth + i * barWidth
        const y = graphHeight - value - coordBarWidth
        const offsetX = x + paddingLeftRight
        data[i].x = offsetX

        if (selectedTimestamps.length > 0) {
          if (selectedTimestamps.includes(timestamp)) {
            sketch.fill('rgb(49,175,211)')
          } else {
            sketch.fill('rgba(49,175,211,.2)')
          }
        } else {
          // 没有画好 或者 啥也没画
          sketch.fill('rgb(49,175,211)')
        }

        // 柱
        sketch.rect(x, y, barWidth, value)

        // 日期
        if (i % 2 === 1) {
          sketch.push()
          sketch.fill('#000000')
          sketch.textFont('Khand', 10)
          sketch.translate(x, graphHeight + coordBarWidth + 18)
          sketch.rotate(-Math.PI / 3)
          sketch.text(date, 0, 0)
          sketch.pop()
        }
      }

      sketch.pop()

      if (isDrawing) { // 正在画
        sketch.push()
        sketch.fill('rgba(154, 175, 254, 0.2)')
        sketch.drawingContext.setLineDash([5, 5])
        sketch.rect(
          drawStartPosition[0],
          drawStartPosition[1],
          sketch.pmouseX - drawStartPosition[0],
          sketch.pmouseY - drawStartPosition[1]
        )
        sketch.pop()
      }
    }

    sketch.mousePressed = (e) => { // 初始化
      if (window.IS_FILTERING || !$.contains($dom[0], e.target)) { return }

      isDrawing = true
      drawStartPosition = [sketch.pmouseX, sketch.pmouseY]
      selectedTimestamps = []
    }

    sketch.mouseReleased = () => {
      if (window.IS_FILTERING) {
        window.IS_FILTERING = false
        $(window).trigger('reset-filter')
        selectedTimestamps = []
        return
      }
      if (!isDrawing) { return }

      isDrawing = false

      const [ startX ] = drawStartPosition
      const endX = sketch.pmouseX

      selectedTimestamps = data
        .filter(({ x }) => isInRange(x, Math.min(startX, endX) - barWidth, Math.max(startX, endX)))
        .map(({ timestamp }) => timestamp)

      if (selectedTimestamps.length === 0 || startX === endX) {
        // 啥也没画
        $(window).trigger('reset-filter')
        selectedTimestamps = []
        return
      }

      $(window).trigger('filter', {
        type: 'timestamp',
        range: [
          _.first(selectedTimestamps),
          _.last(selectedTimestamps) + 24 * 60 * 60 * 1000 - 1,
        ], // range
      })
    }
  }

  p5inst = new P5(inst, $dom[0])
}

export const renderFrequency = (parsedData) => {
  if (p5inst) {
    p5inst.remove()
    p5inst = null
    $(targetDOMId).empty()
  }

  if (parsedData.length === 0) {
    return
  }

  const timestampList = parsedData.map(({ timestamp }) => timestamp - timestamp % (24 * 60 * 60 * 1000)).sort((a, b) => a - b)

  let prev = 0
  const data = timestampList.reduce((arr, current) => {
    if (current !== prev) {
      prev = current
      const d = new Date(current)
      arr.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, count: 1, timestamp: current })
    } else {
      arr[arr.length - 1].count = arr[arr.length - 1].count + 1
    }
    return arr
  }, [])

  draw(data)
}
