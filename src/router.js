import { createRouter, createWebHistory } from 'vue-router'
import LoginView from './views/LoginView.vue'
import RegisterView from './views/RegisterView.vue'
import VerifyEmailView from './views/VerifyEmailView.vue'
import ForgotPasswordView from './views/ForgotPasswordView.vue'
import ChatView from './views/ChatView.vue'
import NotificationsView from './views/NotificationsView.vue'
import NotificationDetailView from './views/NotificationDetailView.vue'
import UsersView from './views/UsersView.vue'
import ChangePasswordView from './views/ChangePasswordView.vue'

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
        path: '/register',
        name: 'Register',
        component: RegisterView,
    },
    {
        path: '/verify-email',
        name: 'VerifyEmail',
        component: VerifyEmailView,
    },
    {
        path: '/forgot-password',
        name: 'ForgotPassword',
        component: ForgotPasswordView,
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
    {
        path: '/notifications/:id',
        name: 'NotificationDetail',
        component: NotificationDetailView,
    },
    {
        path: '/users',
        name: 'Users',
        component: UsersView,
    },
    {
        path: '/change-password',
        name: 'ChangePassword',
        component: ChangePasswordView,
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

// Guard: si no hay token, redirigir a login (excepto rutas públicas)
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token')
    const publicRoutes = ['Login', 'Register', 'VerifyEmail', 'ForgotPassword']

    if (!publicRoutes.includes(to.name) && !token) {
        next({ name: 'Login' })
    } else if ((to.name === 'Login' || to.name === 'Register') && token) {
        next({ name: 'Chat' })
    } else {
        next()
    }
})

export default router
