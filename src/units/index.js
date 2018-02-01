import kurentoUtils from 'kurento-utils'

class Participant {
  constructor (id, ws) {
    this.id = id
    this.stream = ''
    this.webRtcPeer = null
    this.ws = ws
    this.senderId = null
  }
  createKurento (id) {
    this.senderId = id
    let kurentoType = id === this.id ? 'WebRtcPeerSendonly' : 'WebRtcPeerRecvonly'
    let option = {
      dataChannelConfig: {
        id: '666',
        onmessage: this.onMessage
      },
      dataChannels: true,
      onicecandidate: (candidate) => {
        var message = {
          id: 'onIceCandidate',
          name: this.id,
          candidate: candidate
        }
        sendMessage(message, this.ws)
      },
      onerror: this.onError
    }
    this.webRtcPeer = new kurentoUtils.WebRtcPeer[kurentoType](option, (error) => {
      if (error) {
        return console.error(error)
      }

      this.webRtcPeer.generateOffer((error, offerSdp) => {
        if (error) { return console.error('Error generating the offer') }

        let message = { id: 'receiveVideoFrom',
          sender: this.id,
          sdpOffer: offerSdp
        }
        sendMessage(message, this.ws)
      })
    })
  }

  addIceCandidate (parseMsg) {
    this.webRtcPeer.addIceCandidate(parseMsg.candidate, (error) => {
      if (error) { return console.error('Error adding candidate: ' + error) }
    })
  }
  receiveVideoAnswer (message) {
    this.webRtcPeer.processAnswer(message.sdpAnswer, (error) => {
      if (error) { return console.error(error) }
      if (this.senderId === this.id) {
        this.stream = window.URL.createObjectURL(this.webRtcPeer.getLocalStream())
      } else {
        this.stream = window.URL.createObjectURL(this.webRtcPeer.getRemoteStream())
      }
    })
  }
  onError () {
    alert('发生错误，内容待定')
  }
}

function sendMessage (message, ws) {
  let msg = JSON.stringify(message)
  ws.send(msg)
}

export default Participant
