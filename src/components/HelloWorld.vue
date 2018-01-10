<template>
  <div class="hello">
    <div>Test label: <router-link to="/label">Label</router-link></div>
    <div>
      <label for="user">Name:</label>
      <br>
      <input type="text" v-model="userName">
      <button @click="regist">Regist</button>
    </div>
    <div>
      <label for="user">peer:</label>
      <br>
      <input type="text" v-model="peer">
    </div>
    <div>
      <button @click="call">Call</button>
      <button @click="stop">Stop</button>
      <button @click="saveVideo">save</button>
      <button @click="sendChannelData" :disabled="webRtcPeer === null">send</button>
    </div>
    <div v-if="imgurl">
      <img :src="imgurl">
    </div>
    <div
      ref="container"
      class="container"
      @mousedown="handlerMouseDown"
      @mouseup="handlerMouseUp"
      @mousemove="handlerMouseMove"
      @mouseout="handlerMouseOut"
    >
    </div>
    <p>
      mode:
      <input type="radio" name="mode" value="rect" v-model="mode">
      <label for="">Rect</label>
      <input type="radio" name="mode" value="brush" v-model="mode">
      <label for="">Brush</label>
      <input type="radio" name="mode" value="arrow" v-model="mode">
      <label for="">Arrow</label>
    </p>
    <div>
      <video ref="inputVideo" id="inputVideo" autoplay width="720px" height="480px"></video>
    </div>
    <div>
      <video ref="outputVideo" autoplay width="720px" height="480px"></video>
    </div>
  </div>
</template>

<script>
import kurentoUtils from 'kurento-utils'
import zrender from 'zrender'
import _ from 'lodash'
const ws = new WebSocket('wss://192.168.1.52:8890/call')

export default {
  name: 'HelloWorld',
  data () {
    return {
      userName: '',
      peer: '',
      webRtcPeer: null,
      from: '',
      sendMsg: '',
      video: null,
      imgurl: '',
      imageData: '',
      // zrender
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
    ws.onmessage = (message) => {
      let parsedMessage = JSON.parse(message.data)
      switch (parsedMessage.id) {
        case 'resgisterResponse':
          this.resgisterResponse(parsedMessage)
          break
        case 'callResponse':
          this.callResponse(parsedMessage)
          break
        case 'incomingCall':
          this.incomingCall(parsedMessage)
          break
        case 'iceCandidate':
          this.webRtcPeer.addIceCandidate(parsedMessage.candidate, (error) => {
            if (error) { return console.error('Error adding candidate: ' + error) }
          })
          break
        case 'startCommunication':
          this.startCommunication(parsedMessage)
          break
        case 'stopCommunication':
          this.stopCommunication(parsedMessage)
          break
        default:
          break
      }
    }
  },

  methods: {
    regist () {
      let message = {
        id: 'register',
        name: this.userName
      }
      this.sendMessage(message)
    },

    incomingCall (message) {
      let constraints = {
        audio: true,
        video: {
          width: 720,
          height: 480,
          framerate: 15
        }
      }
      let option = {
        localVideo: this.$refs['inputVideo'],
        remoteVideo: this.$refs['outputVideo'],
        dataChannelConfig: {
          id: this.getChannelName(),
          onmessage: this.onMessage
        },
        dataChannels: true,
        onicecandidate: this.onIceCandidate,
        mediaConstraints: constraints,
        onerror: this.onError
      }
      this.from = message.from
      this.webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(option, (error) => {
        if (error) {
          return console.error(error)
        }

        this.webRtcPeer.generateOffer(this.onOfferIncomingCall)
      })
    },
    startCommunication (message) {
      this.webRtcPeer.processAnswer(message.sdpAnswer, function (error) {
        if (error) { return console.error(error) }
      })
    },
    onOfferCall (error, offerSdp) {
      if (error) { return console.error('Error generating the offer') }

      console.log('Invoking SDP offer callback function')
      let message = {
        id: 'call',
        from: this.userName,
        to: this.peer,
        sdpOffer: offerSdp
      }
      this.sendMessage(message)
    },

    onOfferIncomingCall (error, offerSdp) {
      if (error) { return console.error('Error generating the offer') }
      var response = {
        id: 'incomingCallResponse',
        from: this.from,
        callResponse: 'accept',
        sdpOffer: offerSdp
      }
      this.sendMessage(response)
    },

    onIceCandidate (candidate) {
      console.log('Local candidate' + JSON.stringify(candidate))

      var message = {
        id: 'onIceCandidate',
        candidate: candidate
      }
      this.sendMessage(message)
    },

    onError () {
      alert('发生错误，内容待定')
    },
    call () {
      let constraints = {
        audio: true,
        video: {
          width: 720,
          height: 480,
          framerate: 15
        }
      }
      let options = {
        localVideo: this.$refs['inputVideo'],
        remoteVideo: this.$refs['outputVideo'],
        dataChannelConfig: {
          id: this.getChannelName(),
          onmessage: this.onMessage
        },
        dataChannels: true,
        onicecandidate: this.onIceCandidate,
        mediaConstraints: constraints,
        onerror: this.onError
      }

      this.webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, (error) => {
        if (error) {
          return console.error(error)
        }
        this.webRtcPeer.generateOffer(this.onOfferCall)
      })
    },
    callResponse (message) {
      this.webRtcPeer.processAnswer(message.sdpAnswer, function (error) {
        if (error) { return console.error(error) }
      })
    },
    resgisterResponse (message) {
      alert('注册成功')
    },
    stopCommunication (message) {
      if (this.webRtcPeer) {
        this.webRtcPeer.dispos()
        this.webRtcPeer = null
      }
    },
    stop () {
      if (this.webRtcPeer) {
        this.webRtcPeer.dispose()
        this.webRtcPeer = null
      }
      let message = {
        id: 'stop'
      }
      this.sendMessage(message)
    },
    sendChannelData () {
      this.sendMsg = document.querySelector('canvas').toDataURL()
      let delay = 10
      let charSlice = 10000
      let dataSent = 0
      let intervalID = 0

      intervalID = setInterval(() => {
        let slideEndIndex = dataSent + charSlice
        if (slideEndIndex > this.sendMsg.length) {
          slideEndIndex = this.sendMsg.length
        }
        this.webRtcPeer.send(this.sendMsg.slice(dataSent, slideEndIndex))
        dataSent = slideEndIndex
        if (dataSent + 1 >= this.sendMsg.length) {
          this.webRtcPeer.send('\n')
          zrender.dispose(this.zr)
          clearInterval(intervalID)
        }
      }, delay)
    },
    getChannelName () {
      return 'incomingCallResponse' + parseInt(Math.random() * 100)
    },
    onMessage (event) {
      if (event.data === '\n') {
        this.imgurl = this.imageData
        this.imageData = ''
      } else {
        this.imageData += event.data
      }
    },
    saveVideo () {
      // this.context.fillRect(0, 0, this.w, this.h)
      // this.context.drawImage(this.video, 0, 0, this.w, this.h)
      // let img = document.createElement('img')
      // img.src = this.webRtcPeer.currentFrame.toDataURL()
      console.log(this.webRtcPeer)
      this.zr = zrender.init(this.$refs['container'])
      let image = new zrender.Image({
        style: {
          x: 0,
          y: 0,
          height: 480,
          width: 720,
          image: this.webRtcPeer.currentFrame
        },
        cursor: 'crosshair'
      })

      this.zr.add(image)
    },
    sendMessage (message) {
      let msg = JSON.stringify(message)
      console.log('发送:' + msg)
      ws.send(msg)
    },

    // zrender绘图
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
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1, h2 {
  font-weight: normal;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
.container{
  width: 720px;
  height: 480px;
  margin:0 auto;
}
</style>
