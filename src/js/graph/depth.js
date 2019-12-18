import _ from 'underscore'
import $ from 'jquery'
import { dataScale, isInRange } from '../utils'
import P5 from 'p5'
import 'p5.js-svg'

window.$ = $

const targetDOMId = '#depth'
const containerDOM = '.J_panel4'
let p5inst = null

let maxCount = null
let minCount = null

const textLabels = [
  '< 70',
  '< 300',
  '≤ 700',
]

const levelLabels = [
  'shallow',
  'intermediate',
  'deep',
]

const depthColorList = [
  '52,182,183',
  '123,227,158',
  '236,255,177',
]

const filterRanges = [
  [0, 70],
  [70, 300],
  [300, 700],
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

  const dataTextStartX = $subtitle.offset().left - $title.offset().left // QUANTITY文字的x
  const graphHeight = domHeight - 2 * paddingTopBottom // 整个图表的高度
  const dataCount = data.length
  const binFontSize = 18
  const smallFontSize = 13
  const smallFontLeft = 20 // 小字的右边距离canvas最左边的距离
  const barPaddingLeft = 10 // 柱距离左侧文字的距离
  const barHeight = graphHeight / dataCount * 0.6 // 单个柱子的高度
  const barSplitHeight = (graphHeight - dataCount * barHeight) / (dataCount - 1) // 柱间距
  const barMaxWidth = dataTextStartX - smallFontLeft - barPaddingLeft

  const inst = (sketch) => {
    let isDrawing = false
    let drawStartPosition = [0, 0]
    let selectedDepth = []

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
        const count = data[i].count
        const value = dataScale(count, [minCount, maxCount], [barMaxWidth * 0.05, barMaxWidth * 0.95])
        const y = i * barSplitHeight + i * barHeight
        const offsetY = y + paddingTopBottom
        data[i].y = offsetY

        if (selectedDepth.length > 0) {
          if (selectedDepth.includes(i)) {
            sketch.fill(`rgb(${depthColorList[i]})`)
          } else {
            sketch.fill(`rgba(${depthColorList[i]},.2)`)
          }
        } else {
          // 没有画好 或者 啥也没画
          sketch.fill(`rgb(${depthColorList[i]})`)
        }

        // 柱子
        sketch.rect(smallFontLeft + barPaddingLeft, y, value, barHeight)

        sketch.push()
        // 右侧文字
        sketch.fill('#000000')
        sketch.textFont('Khand', binFontSize)
        sketch.text(count.toLocaleString(), dataTextStartX, y + binFontSize / 2 + barHeight / 2 - 2) // Magic number

        // 左侧文字
        sketch.textFont('Khand', smallFontSize)
        sketch.textAlign(sketch.RIGHT)
        sketch.text(textLabels[i], smallFontLeft, y + smallFontSize / 2 + barHeight / 2 - 2) // Magic number

        // 柱子上的文字
        sketch.textAlign(sketch.LEFT)
        sketch.text(levelLabels[i], barPaddingLeft + smallFontLeft + 10, y + smallFontSize / 2 + barHeight / 2 - 2) // Magic number
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
      selectedDepth = []
    }

    sketch.mouseReleased = (e) => {
      if (window.IS_FILTERING && $.contains($dom[0], e.target)) {
        window.IS_FILTERING = false
        selectedDepth = []
        $(window).trigger('reset-filter')
        return
      }
      if (!isDrawing) { return }

      isDrawing = false

      const [ , startY ] = drawStartPosition
      const endY = sketch.pmouseY

      selectedDepth = data
        .filter(({ y }) => isInRange(y, Math.min(startY, endY) - barHeight, Math.max(startY, endY)))
        .map(({ id }) => id)

      if (selectedDepth.length === 0 || startY === endY) {
        // 啥也没画
        $(window).trigger('reset-filter')
        selectedDepth = []
        return
      }

      $(window).trigger('filter', {
        type: 'depth',
        range: [
          filterRanges[_.first(selectedDepth)],
          filterRanges[_.last(selectedDepth)],
        ],
      })
    }
  }

  p5inst = new P5(inst, $dom[0])
}

export const renderDepth = (parsedData) => {
  if (p5inst) {
    p5inst.remove()
    p5inst = null
    $(targetDOMId).empty()
  }

  if (parsedData.length === 0) {
    return
  }

  const dataset = [
    { id: 0, count: 0, y: 0 },
    { id: 1, count: 0, y: 0 },
    { id: 2, count: 0, y: 0 },
  ]

  parsedData.forEach(({ depth }) => {
    let index = 0
    if (depth < 70) {
      index = 0
    } else if (depth < 300) {
      index = 1
    } else {
      index = 2
    }
    dataset[index].count += 1
  })

  draw(dataset)
}
