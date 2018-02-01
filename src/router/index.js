import Vue from 'vue'
import Router from 'vue-router'
import HelloWorld from '@/components/HelloWorld'
import Label from '@/components/Label'
import HomePage from '@/components/HomePage'
import GroupPage from '@/components/GroupPage'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'HomePage',
      component: HomePage
    },
    {
      path: '/group/:tenantId/:userId/:roomId',
      name: 'GroupPage',
      component: GroupPage
    },
    {
      path: '/one',
      name: 'HelloWorld',
      component: HelloWorld
    },
    {
      path: '/label',
      name: 'label',
      component: Label
    }
  ]
})
