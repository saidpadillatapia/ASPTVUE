import axios from 'axios'
import echo from './echo'

const api = axios.create({
    baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
})

// Interceptor: agregar el token de Sanctum a cada petición
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
    }

    // Enviar X-Socket-ID para que toOthers() funcione en broadcasting
    const socketId = echo.socketId()
    if (socketId) {
        config.headers['X-Socket-ID'] = socketId
    }
    return config
})

// Interceptor de respuesta: si da 401, limpiar sesión y redirigir
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            // Solo redirigir si no estamos ya en login o register
            if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
                window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

export default api
