<template>
  <div class="notif-page">
    <div class="notif-header">
      <button @click="goBack" class="btn-back">← Volver al chat</button>
      <h2>Notificaciones</h2>
    </div>

    <div class="notif-list">
      <div v-if="loading" class="center-text">Cargando...</div>

      <div v-if="!loading && notifications.length === 0" class="center-text">
        No tienes notificaciones
      </div>

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
    </div>
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

const formatTime = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
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

const openDetail = (notif) => {
  router.push('/notifications/' + notif.id)
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

.btn-back:hover { text-decoration: underline; }

.notif-list { padding: 12px; }

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

.notif-item:hover { background: #f5f5f5; }
.notif-item.unread { background: #f0f7ff; }

.notif-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.notif-content { flex: 1; }

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
</style>
