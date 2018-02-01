<template>
  <div>
    <video style="background: #000; margin: 10px;" :class="participant.id" autoplay :src="participant.stream" v-for="participant in participants" :key="participant.id"></video>
  </div>
</template>

<script>
import Participant from '../units'
export default {
  data () {
    return {
      ws: null,
      participant: null,
      participants: []
    }
  },
  mounted () {
    this.initWs()
  },
  methods: {
    initWs () {
      this.ws = new WebSocket(`wss://192.168.1.136:11010/room/join/${this.$route.params.tenantId}/${this.$route.params.userId}/${this.$route.params.roomId}`)
      this.ws.onmessage = message => {
        let parseMsg = JSON.parse(message.data)
        switch (parseMsg.id) {
          case 'existingParticipants': // 已存在的参与者
            this.participants = []
            if (parseMsg.data) {
              parseMsg.data.forEach(item => {
                this.participant = new Participant(item, this.ws)
                this.participant.createKurento(item)
              })
            } else {
              this.participant = new Participant(this.$route.params.userId, this.ws)
              this.participant.createKurento(this.$route.params.userId)
            }
            this.participants.push(this.participant)
            break
          case 'newParticipantArrived': // 新加入的人
            this.participant = new Participant(parseMsg.name, this.ws)
            this.participant.createKurento(this.$route.params.userId)
            this.participants.push(this.participant)
            break
          // case 'receiveVideoFrom': // 接收某个指定参与者的视频和音频

          //   break
          case 'iceCandidate': // 接收某个指定参与者的视频和音频的回复消息
            this.participant.addIceCandidate(parseMsg)
            break
          case 'receiveVideoAnswer': // 接收某个指定参与者的视频和音频的应答
            let _id = parseMsg.name
            this.participants.map(item => {
              if (item.id === _id) {
                item.receiveVideoAnswer(parseMsg)
              }
            })
            break
          // case 'onIceCandidate': // 客户端发送IceCandidate

          //   break
          default:
            break
        }
      }
    }
  }
}
</script>

<style>

</style>
