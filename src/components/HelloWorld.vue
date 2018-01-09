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
    </div>
    <div>
      <video ref="inputVideo" autoplay width="640px" height="480px"></video>
    </div>
    <div>
      <video ref="outputVideo" autoplay width="640px" height="480px"></video>
    </div>
  </div>
</template>

<script>
import kurentoUtils from 'kurento-utils'
const ws = new WebSocket('wss://192.168.1.52:8890/call')
// var webRtcPeer

export default {
  name: 'HelloWorld',
  data () {
    return {
      userName: '',
      peer: '',
      webRtcPeer: null,
      from: ''
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
      let option = {
        localVideo: this.$refs['inputVideo'],
        remoteVideo: this.$refs['outputVideo'],
        onicecandidate: this.onIceCandidate,
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
      let options = {
        localVideo: this.$refs['inputVideo'],
        remoteVideo: this.$refs['outputVideo'],
        onicecandidate: this.onIceCandidate,
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
