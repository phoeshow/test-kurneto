<template>
  <div>
    <input type="text" v-model="roomId" placeholder="创建房间">
    <input type="text" v-model="roomId" placeholder="加入房间">
    <input type="button" value="创建" @click="initRoom">
    <input type="button" value="加入" @click="joinRoom">
  </div>
</template>

<script>
import axios from 'axios'
export default {
  data () {
    return {
      tenantId: 'tenant',
      roomId: ''
    }
  },
  methods: {
    initRoom () {
      axios({
        url: 'https://192.168.1.136:11010/room/init',
        method: 'get',
        params: {
          tenantId: this.tenantId,
          roomId: this.roomId
        }
      }).then(response => {
        console.log(response)
      }).catch(error => {
        console.log(error)
      })
    },
    joinRoom () {
      this.$router.push({
        name: 'GroupPage',
        params: {
          tenantId: this.tenantId,
          userId: parseInt((Math.random() * 1000000000) / 1000),
          roomId: this.roomId
        }
      })
    }
  }
}
</script>

<style>

</style>
