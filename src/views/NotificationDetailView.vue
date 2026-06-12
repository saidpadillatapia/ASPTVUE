<template>
  <div class="detail-page">
    <div class="header">
      <button @click="goBack" class="btn-back">← Volver</button>
      <strong>Detalle</strong>
      <span></span>
    </div>

    <div v-if="loading" class="center-text">Cargando...</div>

    <div v-else-if="notification" class="detail-card">
      <div class="detail-icon">{{ getIcon(notification.type) }}</div>
      <div class="detail-type">{{ getTypeLabel(notification.type) }}</div>
      <h2 class="detail-title">{{ notification.title }}</h2>
      <p class="detail-desc">{{ notification.description }}</p>
      <p class="detail-date">{{ formatDate(notification.created_at) }}</p>
      <span class="detail-status" :class="{ read: notification.read }">
        {{ notification.read ? '✓ Leída' : '● No leída' }}
      </span>
    </div>

    <div v-else class="center-text">Notificación no encontrada</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../api'

const router = useRouter()
const route = useRoute()
const notification = ref(null)
const loading = ref(true)

const getIcon = (type) => {
  const icons = {
    mensaje: '📩',
    multa: '⚠️',
    asamblea: '📋',
    pago_atrasado: '💰',
  }
  return icons[type] || '🔔'
}

const getTypeLabel = (type) => {
  const labels = {
    mensaje: 'Mensaje',
    multa: 'Multa',
    asamblea: 'Asamblea',
    pago_atrasado: 'Pago Atrasado',
  }
  return labels[type] || type
}

const formatDate = (d) => {
  if (!d) return ''
  const date = new Date(d)
  return date.toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }) + ' a las ' + date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

const goBack = () => {
  router.push('/notifications')
}

onMounted(async () => {
  const id = route.params.id
  try {
    const res = await api.get('/notifications/' + id)
    notification.value = res.data
  } catch (err) {
    if (err.response?.status === 401) {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      router.push('/login')
    }
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.detail-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  max-width: 550px;
  margin: 0 auto;
  background: #fff;
  border-left: 1px solid #ddd;
  border-right: 1px solid #ddd;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #ddd;
  background: #f8f8f8;
}

.btn-back {
  padding: 5px 10px;
  background: none;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.btn-back:hover {
  background: #eee;
}

.center-text {
  text-align: center;
  color: #999;
  margin-top: 40px;
}

.detail-card {
  padding: 30px 20px;
  text-align: center;
}

.detail-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.detail-type {
  font-size: 12px;
  color: #4a90d9;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

.detail-title {
  font-size: 18px;
  font-weight: 600;
  color: #222;
  margin-bottom: 16px;
}

.detail-desc {
  font-size: 14px;
  color: #444;
  line-height: 1.6;
  text-align: left;
  padding: 16px;
  background: #f8f8f8;
  border-radius: 6px;
  margin-bottom: 16px;
}

.detail-date {
  font-size: 12px;
  color: #999;
  margin-bottom: 12px;
}

.detail-status {
  font-size: 12px;
  color: #e00;
  font-weight: 500;
}

.detail-status.read {
  color: #090;
}
</style>
