import axios from 'axios'
import echo from './echo'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
})

// Enviar X-Socket-ID para que toOthers() funcione
api.interceptors.request.use((config) => {
    const socketId = echo.socketId()
    if (socketId) {
        config.headers['X-Socket-ID'] = socketId
    }
    return config
})

export default api
