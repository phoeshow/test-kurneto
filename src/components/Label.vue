<template>
<section>
  <div class="zrender-contrainer" ref="container" @mousedown="handlerMouseDown" @mouseup="handlerMouseUp" @mousemove="handlerMouseMove" @mouseout="handlerMouseOut"></div>
  <div>
    <p>
      mode:
      <input type="radio" name="mode" value="rect" v-model="mode">
      <label for="">Rect</label>
      <input type="radio" name="mode" value="brush" v-model="mode">
      <label for="">Brush</label>
      <input type="radio" name="mode" value="arrow" v-model="mode">
      <label for="">Arrow</label>
      <!-- <button @click="lineX">Line</button> -->
    </p>
  </div>
  <div>
    <p>mousemove position: x:{{mouseMovePos.x}}, y: {{mouseMovePos.y}}</p>
  </div>
</section>
</template>

<script>
import zrender from 'zrender'
import _ from 'lodash'
const logo = require('../assets/logo.png')

export default {
  data () {
    return {
      mode: '',
      zr: null,
      shape: 'rect',
      rect: null,
      brush: null,
      brushPos: [],
      mouseDownPos: {
        x: null,
        y: null
      },
      mouseUpPos: {
        x: null,
        y: null
      },
      mouseMovePos: {
        x: null,
        y: null
      },
      mouseDown: false,
      arrow: null
    }
  },
  mounted () {
    this.zr = zrender.init(this.$refs['container'])

    let img = document.createElement('img')
    img.src = logo

    let image = new zrender.Image({
      style: {
        x: 0,
        y: 0,
        height: 100,
        width: 160,
        image: img
      },
      cursor: 'crosshair'
    })

    this.zr.add(image)
  },

  methods: {
    handlerMouseDown (e) {
      this.rect = null
      this.brush = null
      this.brushPos = []
      this.mouseDown = true
      this.mouseDownPos['x'] = e.zrX
      this.mouseDownPos['y'] = e.zrY

      switch (this.mode) {
        case 'rect':
          this.startDrawRect()
          break
        case 'brush':
          this.startBrushLine()
          break
        case 'arrow':
          this.startArrow()
          break
        default:

          break
      }
    },

    handlerMouseUp (e) {
      this.mouseDown = false
      this.mouseUpPos.x = e.zrX
      this.mouseUpPos.y = e.zrY
    },

    handlerMouseMove (e) {
      if (this.mouseDown) {
        this.mouseMovePos.x = e.zrX
        this.mouseMovePos.y = e.zrY

        switch (this.mode) {
          case 'rect':
            this.duringDrawRect()
            break
          case 'brush':
            this.duringBrushLine()
            break
          case 'arrow':
            this.duringArrow()
            break
          default:

            break
        }
      }
    },
    handlerMouseOut () {
      this.mouseDown = false
      this.brush = null
      this.brushPos = []
    },
    // 绘制箭头
    startArrow () {
      let options = {
        shape: {
          x1: this.mouseDownPos.x,
          y1: this.mouseDownPos.y,
          x2: this.mouseDownPos.x,
          y2: this.mouseDownPos.y
        },
        style: {
          fill: 'none',
          stroke: '#F00'
        },
        cursor: 'crosshair'
      }
      this.arrow = {}
      this.arrow['line'] = new zrender.Line(options)
      this.zr.add(this.arrow['line'])
    },
    duringArrow () {
      this.arrow['line'].attr('shape', {
        x2: this.mouseMovePos.x,
        y2: this.mouseMovePos.y
      })
      let angle = Math.atan2(this.mouseMovePos.y - this.mouseDownPos.y, this.mouseMovePos.x - this.mouseDownPos.x) * 180 / Math.PI
      let angle1 = (angle + 30) * Math.PI / 180
      let angle2 = (angle - 30) * Math.PI / 180
      let topX = this.mouseMovePos.x - 10 * Math.cos(angle1)
      let topY = this.mouseMovePos.y - 10 * Math.sin(angle1)
      let botX = this.mouseMovePos.x - 10 * Math.cos(angle2)
      let botY = this.mouseMovePos.y - 10 * Math.sin(angle2)
      let arrowPointerOptions = {
        shape: {
          points: [
            [this.mouseMovePos.x, this.mouseMovePos.y],
            [topX, topY],
            [botX, botY]
          ]
        },
        style: {
          fill: '#F00',
          stroke: '#F00'
        },
        cursor: 'crosshair'
      }
      console.log(arrowPointerOptions)
      if (this.arrow['pointer']) {
        this.arrow['pointer'].attr('shape', {
          points: [
            [this.mouseMovePos.x, this.mouseMovePos.y],
            [topX, topY],
            [botX, botY]
          ]
        })
      } else {
        this.arrow['pointer'] = new zrender.Polygon(arrowPointerOptions)
        this.zr.add(this.arrow['pointer'])
      }
    },
    // 开始绘制矩形
    startDrawRect () {
      let option = {
        shape: {
          x: this.mouseDownPos['x'],
          y: this.mouseDownPos['y'],
          width: 0,
          height: 0
        },
        style: {
          fill: 'none',
          stroke: '#F00'
        },
        cursor: 'crosshair'
      }
      this.rect = new zrender.Rect(option)
      this.zr.add(this.rect)
    },
    // 绘制矩形
    duringDrawRect () {
      this.rect.attr('shape', {
        width: this.mouseMovePos.x - this.mouseDownPos.x,
        height: this.mouseMovePos.y - this.mouseDownPos.y
      })
    },
    // 开始绘制自由线条
    startBrushLine () {
      this.brushPos.push([this.mouseDownPos.x, this.mouseDownPos.y])
      this.brush = new zrender.Polyline({
        position: [0, 0],
        style: {
          stroke: 'rgba(220, 20, 60, 0.8)',
          lineWidth: 1
        },
        shape: {
          smooth: 'spline',
          points: this.brushPos
        },
        cursor: 'crosshair'
      })
      this.zr.add(this.brush)
    },
    // 绘制自由线条
    duringBrushLine: _.throttle(function () {
      this.brushPos.push([this.mouseMovePos.x, this.mouseMovePos.y])
      this.brush.attr('shape', {
        points: this.brushPos
      })
    }, 1000 / 16)
    // duringBrushLine () {
    // }

    // lineX () {
    //   var smoothLine = new zrender.Polyline({
    //     position: [10, 10],
    //     style: {
    //       stroke: 'rgba(220, 20, 60, 0.8)',
    //       lineWidth: 1
    //     },
    //     shape: {
    //       smooth: 'spline',
    //       points: this.points
    //     }
    //   })
    //   this.zr.add(smoothLine)
    // }
  }
}
</script>

<style>
.zrender-contrainer{
  height: 100px;
  width: 160px;
  border: 1px solid #ddd;
  margin: 0 auto;
}
</style>
