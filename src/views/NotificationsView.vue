<template>
  <div class="notif-page">
    <div class="notif-header">
      <button @click="goBack" class="btn-back">← Volver al chat</button>
      <h2>Notificaciones</h2>
    </div>

    <div class="notif-list">
      <Transition name="fade">
        <div v-if="loading" class="center-text">Cargando notificaciones...</div>
      </Transition>

      <div v-if="!loading && notifications.length === 0" class="center-text">
        No tienes notificaciones
      </div>

      <TransitionGroup name="list" tag="div">
        <div
          v-for="notif in notifications"
          :key="notif.id"
          class="notif-item"
          :class="{ unread: !notif.read }"
          @click="openDetail(notif)"
        >
          <div class="notif-icon">{{ getIcon(notif.type) }}</div>
          <div class="notif-content">
            <p class="notif-title">{{ notif.title }}</p>
            <p class="notif-desc">{{ notif.description }}</p>
            <span class="notif-time">{{ formatTime(notif.created_at) }}</span>
          </div>
          <span v-if="!notif.read" class="dot-unread"></span>
        </div>
      </TransitionGroup>
    </div>

    <!-- Detalle de notificación con Transition -->
    <Transition name="slide-fade">
      <div v-if="selectedNotif" class="notif-detail-overlay" @click.self="closeDetail">
        <div class="notif-detail">
          <h3>{{ selectedNotif.title }}</h3>
          <p class="detail-type">Tipo: {{ translateType(selectedNotif.type) }}</p>
          <p class="detail-desc">{{ selectedNotif.description }}</p>
          <p class="detail-time">{{ formatDate(selectedNotif.created_at) }}</p>
          <button @click="closeDetail" class="btn-close">Cerrar</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'
import echo from '../echo'

const router = useRouter()
const notifications = ref([])
const loading = ref(true)
const selectedNotif = ref(null)
let notifChannel = null

const getUser = () => {
  const s = localStorage.getItem('user')
  return s ? JSON.parse(s) : null
}

const getIcon = (type) => {
  switch (type) {
    case 'mensaje': return '💬'
    case 'multa': return '⚠️'
    case 'asamblea': return '📋'
    case 'pago_atrasado': return '💰'
    default: return '🔔'
  }
}

const translateType = (type) => {
  switch (type) {
    case 'mensaje': return 'Mensaje'
    case 'multa': return 'Multa'
    case 'asamblea': return 'Asamblea'
    case 'pago_atrasado': return 'Pago atrasado'
    default: return type
  }
}

const formatTime = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

const formatDate = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const loadNotifications = async () => {
  try {
    const res = await api.get('/notifications')
    notifications.value = res.data
  } catch (e) {
    if (e.response?.status === 401) {
      localStorage.removeItem('user')
      router.push('/login')
    }
  } finally {
    loading.value = false
  }
}

const openDetail = async (notif) => {
  selectedNotif.value = notif
  if (!notif.read) {
    try {
      await api.post('/notifications/' + notif.id + '/read')
      notif.read = true
    } catch (e) {}
  }
}

const closeDetail = () => {
  selectedNotif.value = null
}

const goBack = () => {
  router.push('/chat')
}

onMounted(() => {
  const user = getUser()
  if (!user) { router.push('/login'); return }

  loadNotifications()

  // Escuchar nuevas notificaciones en tiempo real
  notifChannel = echo.channel('notifications.' + user.id)
  notifChannel.listen('NotificationCreated', (data) => {
    notifications.value.unshift(data)
  })
})

onUnmounted(() => {
  const user = getUser()
  if (notifChannel) echo.leave('notifications.' + user?.id)
})
</script>

<style scoped>
.notif-page {
  max-width: 550px;
  margin: 0 auto;
  min-height: 100vh;
  background: #fff;
  border-left: 1px solid #ddd;
  border-right: 1px solid #ddd;
}

.notif-header {
  padding: 16px;
  border-bottom: 1px solid #ddd;
  background: #f8f8f8;
}

.notif-header h2 {
  margin: 8px 0 0;
  font-size: 18px;
}

.btn-back {
  background: none;
  border: none;
  color: #4a90d9;
  cursor: pointer;
  font-size: 13px;
  padding: 0;
}

.btn-back:hover {
  text-decoration: underline;
}

.notif-list {
  padding: 12px;
}

.center-text {
  text-align: center;
  color: #999;
  padding: 40px 0;
}

.notif-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  border-radius: 6px;
}

.notif-item:hover {
  background: #f5f5f5;
}

.notif-item.unread {
  background: #f0f7ff;
}

.notif-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.notif-content {
  flex: 1;
}

.notif-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 2px;
}

.notif-desc {
  font-size: 12px;
  color: #666;
  margin: 0;
}

.notif-time {
  font-size: 11px;
  color: #999;
}

.dot-unread {
  width: 10px;
  height: 10px;
  background: #4a90d9;
  border-radius: 50%;
  flex-shrink: 0;
}

/* TransitionGroup para la lista */
.list-enter-active {
  transition: all 0.3s ease-out;
}

.list-leave-active {
  transition: all 0.2s ease-in;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* Fade */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Detalle overlay */
.notif-detail-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.notif-detail {
  background: white;
  padding: 24px;
  border-radius: 8px;
  width: 90%;
  max-width: 360px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}

.notif-detail h3 {
  margin: 0 0 8px;
  font-size: 16px;
}

.detail-type {
  font-size: 12px;
  color: #4a90d9;
  margin: 0 0 8px;
}

.detail-desc {
  font-size: 14px;
  color: #333;
  margin: 0 0 8px;
}

.detail-time {
  font-size: 12px;
  color: #999;
  margin: 0 0 16px;
}

.btn-close {
  padding: 8px 16px;
  background: #4a90d9;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

/* Slide-fade para el modal */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
