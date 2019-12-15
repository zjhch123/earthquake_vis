import $ from 'jquery'
import { dataScale } from '../utils'
import P5 from 'p5'
import 'p5.js-svg'

const targetDOMId = '#magnitude'
const containerDOM = '.J_panel3'

const textLabels = [
  '< 4.5',
  '4.5-4.9',
  '5.0-5.9',
  '6.0-6.9',
  '7.0-9.5',
]

const draw = (data) => {
  const sortedByCount = data.slice(0).sort((a, b) => a - b)
  const minCount = sortedByCount[0]
  const maxCount = sortedByCount.slice(-1)[0]

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
    sketch.setup = () => {
      sketch.createCanvas(domWidth, domHeight, sketch.SVG)
    }

    sketch.draw = () => {
      sketch.clear()
      sketch.translate(paddingLeftRight, paddingTopBottom)
      sketch.noStroke()
      sketch.fill('#31AFD3')
      for (let i = 0; i < dataCount; i += 1) {
        const value = dataScale(data[i], [minCount, maxCount], [barMaxWidth * 0.01, barMaxWidth * 0.95])
        const y = i * barSplitHeight + i * barHeight
        // 柱
        sketch.rect(0, y, value, barHeight)

        sketch.push()
        // 右侧文字
        sketch.fill('#000000')
        sketch.textFont('Khand', binFontSize)
        sketch.text(data[i].toLocaleString(), barMaxWidth, y + binFontSize / 2 + barHeight / 2 - 2) // Magic number

        // 柱上文字
        sketch.textFont('Khand', smallFontSize)
        sketch.text(textLabels[i], 15, y + smallFontSize / 2 + barHeight / 2 - 2) // Magic number
        sketch.pop()
      }

      sketch.noLoop()
    }
  }

  new P5(inst, $dom[0])
}

export const renderMagnitude = (parsedData) => {
  const dataset = [0, 0, 0, 0, 0]
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
    dataset[index] += 1
  })

  draw(dataset)
}
