import { createRouter, createWebHistory } from 'vue-router'
import LoginView from './views/LoginView.vue'
import ChatView from './views/ChatView.vue'
import NotificationsView from './views/NotificationsView.vue'

const routes = [
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/login',
        name: 'Login',
        component: LoginView,
    },
    {
        path: '/chat',
        name: 'Chat',
        component: ChatView,
    },
    {
        path: '/notifications',
        name: 'Notifications',
        component: NotificationsView,
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

// Guard: si no hay usuario, redirigir a login
router.beforeEach((to, from, next) => {
    const user = localStorage.getItem('user')
    const protectedRoutes = ['Chat', 'Notifications']
    if (protectedRoutes.includes(to.name) && !user) {
        next({ name: 'Login' })
    } else if (to.name === 'Login' && user) {
        next({ name: 'Chat' })
    } else {
        next()
    }
})

export default router
