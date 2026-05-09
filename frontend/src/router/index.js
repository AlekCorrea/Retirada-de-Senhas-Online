import { createRouter, createWebHistory } from 'vue-router'
import TicketView from '../views/TicketView.vue'
import LoginView from '../views/LoginView.vue'
import AdminView from '../views/AdminView.vue'
import ClientView from '../views/ClientView.vue'
import AtendenteView from '../views/AtendenteView.vue'

const routes = [
  {
    path: '/',
    name: 'Ticket',
    component: TicketView
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminView
  },
  {
    path: '/client',
    name: 'Client',
    component: ClientView
  },
  {
    path: '/atendente',
    name: 'Atendente',
    component: AtendenteView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
