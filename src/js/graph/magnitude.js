import $ from 'jquery'
import _ from 'underscore'
import { dataScale, isInRange } from '../utils'
import P5 from 'p5'
import 'p5.js-svg'

const targetDOMId = '#magnitude'
const containerDOM = '.J_panel3'
let p5inst = null

let maxCount = null
let minCount = null

const textLabels = [
  '< 4.5',
  '4.5-4.9',
  '5.0-5.9',
  '6.0-6.9',
  '7.0-9.5',
]

const filterRanges = [
  [0, 4.5],
  [4.5, 4.9],
  [5, 5.9],
  [6, 6.9],
  [7, 9.5],
]

const draw = (data) => {
  const sortedByCount = data.slice(0).sort((a, b) => a.count - b.count)

  minCount = _.isNull(minCount) ? _.first(sortedByCount).count : minCount
  maxCount = _.isNull(maxCount) ? _.last(sortedByCount).count : maxCount

  const $dom = $(targetDOMId)
  const $container = $(containerDOM)
  const $title = $container.find('.title')
  const $subtitle = $container.find('.subtitle')

  const domWidth = $dom.width()
  const domHeight = $dom.height()

  const paddingLeftRight = 17 // 左坐标轴顶端到dom左边的距离
  const paddingTopBottom = 17 // 左坐标轴顶端到dom顶部的距离

  const barMaxWidth = $subtitle.offset().left - $title.offset().left // 柱的最大宽度, QUANTITY文字的x
  const graphHeight = domHeight - 2 * paddingTopBottom // 整个图表的高度
  const dataCount = data.length
  const barHeight = graphHeight / dataCount * 0.8 // 单个柱子的高度
  const barSplitHeight = (graphHeight - dataCount * barHeight) / (dataCount - 1) // 柱间距
  const binFontSize = 18
  const smallFontSize = 13

  const inst = (sketch) => {
    let isDrawing = false
    let drawStartPosition = [0, 0]
    let selectedMagitude = []

    sketch.setup = () => {
      sketch.createCanvas(domWidth, domHeight, sketch.SVG)
      sketch.frameRate(60)
    }

    sketch.draw = () => {
      sketch.clear()
      sketch.push()
      sketch.translate(paddingLeftRight, paddingTopBottom)
      sketch.noStroke()
      sketch.fill('#31AFD3')
      for (let i = 0; i < dataCount; i += 1) {
        const { count } = data[i]
        const value = dataScale(count, [minCount, maxCount], [barMaxWidth * 0.01, barMaxWidth * 0.95])
        const y = i * barSplitHeight + i * barHeight
        const offsetY = y + paddingTopBottom
        data[i].y = offsetY

        if (selectedMagitude.length > 0) {
          if (selectedMagitude.includes(i)) {
            sketch.fill('rgb(49,175,211)')
          } else {
            sketch.fill('rgba(49,175,211,.2)')
          }
        } else {
          // 没有画好 或者 啥也没画
          sketch.fill('rgb(49,175,211)')
        }

        // 柱
        sketch.rect(0, y, value, barHeight)

        sketch.push()
        // 右侧文字
        sketch.fill('#000000')
        sketch.textFont('Khand', binFontSize)
        sketch.text(count.toLocaleString(), barMaxWidth, y + binFontSize / 2 + barHeight / 2 - 2) // Magic number

        // 柱上文字
        sketch.textFont('Khand', smallFontSize)
        sketch.text(textLabels[i], 15, y + smallFontSize / 2 + barHeight / 2 - 2) // Magic number
        sketch.pop()
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
      selectedMagitude = []
    }

    sketch.mouseReleased = (e) => {
      if (window.IS_FILTERING && $.contains($dom[0], e.target)) {
        window.IS_FILTERING = false
        $(window).trigger('reset-filter')
        selectedMagitude = []
        return
      }
      if (!isDrawing) { return }

      isDrawing = false

      const [ , startY ] = drawStartPosition
      const endY = sketch.pmouseY

      selectedMagitude = data
        .filter(({ y }) => isInRange(y, Math.min(startY, endY) - barHeight, Math.max(startY, endY)))
        .map(({ id }) => id)

      if (selectedMagitude.length === 0 || startY === endY) {
        // 啥也没画
        $(window).trigger('reset-filter')
        selectedMagitude = []
        return
      }

      $(window).trigger('filter', {
        type: 'magnitude',
        range: [
          filterRanges[_.first(selectedMagitude)],
          filterRanges[_.last(selectedMagitude)],
        ],
      })
    }
  }

  p5inst = new P5(inst, $dom[0])
}

export const renderMagnitude = (parsedData) => {
  if (p5inst) {
    p5inst.remove()
    p5inst = null
    $(targetDOMId).empty()
  }

  if (parsedData.length === 0) {
    return
  }

  const dataset = [
    { id: 0, y: 0, count: 0, range: [0, 4.5] },
    { id: 1, y: 0, count: 0, range: [4.5, 4.9] },
    { id: 2, y: 0, count: 0, range: [5, 5.9] },
    { id: 3, y: 0, count: 0, range: [6, 6.9] },
    { id: 4, y: 0, count: 0, range: [7, 9.5] },
  ]

  parsedData.forEach(({ magnitude }) => {
    let index = 0
    if (magnitude < 4.5) {
      index = 0
    } else if (magnitude < 4.9) {
      index = 1
    } else if (magnitude < 5.9) {
      index = 2
    } else if (magnitude < 6.9) {
      index = 3
    } else {
      index = 4
    }
    dataset[index].count += 1
  })

  draw(dataset)
}
