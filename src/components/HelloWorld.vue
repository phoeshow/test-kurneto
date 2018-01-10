<template>
  <div class="hello">
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
    <canvas ref="canvas"></canvas>
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
const ws = new WebSocket('wss://192.168.1.52:8890/call')
// const ws = new WebSocket('wss://192.168.1.52:8890/call')
// var webRtcPeer

export default {
  name: 'HelloWorld',
  data () {
    return {
      userName: '',
      peer: '',
      webRtcPeer: null,
      from: '',
      sendMsg: '',
      context: null,
      w: null,
      h: null,
      video: null,
      canvas: null,
      imgurl: '',
      imageData: ''
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
    this.video = this.$refs['inputVideo']
    this.canvas = this.$refs['canvas']
    this.context = this.canvas.getContext('2d')
    this.video.addEventListener('loadedmetadata', () => {
      this.w = this.video.videoWidth
      this.h = this.video.videoHeight
      this.canvas.width = this.w
      this.canvas.height = this.h
    }, false)
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
      this.sendMsg = this.canvas.toDataURL()
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
          clearInterval(intervalID)
        }
      }, delay)
    },
    getChannelName () {
      return 'incomingCallResponse'
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
      this.context.fillRect(0, 0, this.w, this.h)
      this.context.drawImage(this.video, 0, 0, this.w, this.h)
    },
    sendMessage (message) {
      let msg = JSON.stringify(message)
      console.log('发送:' + msg)
      ws.send(msg)
    }
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
</style>
