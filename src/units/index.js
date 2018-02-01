import kurentoUtils from 'kurento-utils'

class Participant {
  constructor (id, ws) {
    this.id = id
    this.remoteSteam = ''
    this.localSteam = ''
    this.webRtcPeer = null
    this.ws = ws
  }
  createKurento () {
    let option = {
      dataChannelConfig: {
        id: '666',
        onmessage: this.onMessage
      },
      dataChannels: true,
      onicecandidate: (candidate) => {
        var message = {
          id: 'onIceCandidate',
          candidate: candidate
        }
        sendMessage(message, this.ws)
      },
      onerror: this.onError
    }
    this.webRtcPeer = new kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(option, (error) => {
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
      this.remoteSteam = window.URL.createObjectURL(this.webRtcPeer.getRemoteStream())
      this.localSteam = window.URL.createObjectURL(this.webRtcPeer.getLocalStream())
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
