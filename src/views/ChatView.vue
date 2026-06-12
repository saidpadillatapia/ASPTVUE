<template>
  <div class="chat-page">
    <!-- Header -->
    <div class="header">
      <div>
        <strong>Chat en Vivo</strong>
        <span class="user-info">— {{ currentUser?.name }}</span>
        <span v-if="currentUser?.role === 'admin'" class="admin-badge">ADMIN</span>
      </div>
      <div class="header-actions">
        <button @click="goToNotifications" class="btn-notif">
          🔔
          <Transition name="bounce">
            <span v-if="unreadCount > 0" :key="unreadCount" class="badge">{{ unreadCount }}</span>
          </Transition>
        </button>
        <button v-if="currentUser?.role === 'admin'" @click="goToUsers" class="btn-admin">
          👥 Usuarios
        </button>
        <button v-if="currentUser?.role === 'admin'" @click="showAdminPanel = !showAdminPanel" class="btn-admin">
          ⚙️ Multas
        </button>
        <button @click="logout" class="btn-logout">Salir</button>
      </div>
    </div>

    <!-- Panel Admin para poner multas -->
    <Transition name="slide-down">
      <div v-if="showAdminPanel" class="admin-panel">
        <h3>Aplicar multa / notificación</h3>
        <div class="admin-form">
          <select v-model="adminForm.user_id">
            <option value="">Seleccionar usuario</option>
            <option v-for="u in usersList" :key="u.id" :value="u.id">{{ u.name }}</option>
          </select>
          <select v-model="adminForm.type">
            <option value="multa">Multa</option>
            <option value="asamblea">Asamblea</option>
            <option value="pago_atrasado">Pago atrasado</option>
          </select>
          <input v-model="adminForm.title" placeholder="Título (ej: Multa por retraso)" />
          <input v-model="adminForm.description" placeholder="Descripción" />
          <button @click="sendNotification" :disabled="!adminForm.user_id || !adminForm.title || adminSending">
            <Transition name="fade" mode="out-in">
              <span v-if="adminSending" key="loading">⏳ Enviando...</span>
              <span v-else key="normal">Enviar notificación</span>
            </Transition>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Mensajes -->
    <div class="messages" ref="messagesContainer">
      <div v-if="loading" class="center-text">Cargando...</div>
      <div v-else-if="messages.length === 0" class="center-text">No hay mensajes aún</div>

      <div
        v-for="msg in messages"
        :key="msg.id"
        class="msg"
        :class="{ mine: msg.user_id === currentUser?.id }"
      >
        <div class="bubble">
          <span class="name" v-if="msg.user_id !== currentUser?.id">{{ msg.user?.name }}</span>
          <span class="text">{{ msg.message }}</span>
          <span class="time">{{ formatTime(msg.created_at) }}</span>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="input-bar">
      <input
        v-model="newMessage"
        @keyup.enter="sendMessage"
        placeholder="Escribe un mensaje..."
        :disabled="sending"
      />
      <button @click="sendMessage" :disabled="!newMessage.trim() || sending" class="btn-send">
        <Transition name="fade" mode="out-in">
          <span v-if="sending" key="loading">⏳</span>
          <span v-else key="normal">Enviar</span>
        </Transition>
      </button>
    </div>

    <!-- Alerta con transición -->
    <Transition name="toast">
      <div v-if="alertMsg" class="toast" :class="alertType">{{ alertMsg }}</div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'
import echo from '../echo'

const router = useRouter()
const messages = ref([])
const newMessage = ref('')
const loading = ref(true)
const sending = ref(false)
const messagesContainer = ref(null)
const currentUser = ref(null)
const unreadCount = ref(0)
const showAdminPanel = ref(false)
const usersList = ref([])
const adminSending = ref(false)
const adminForm = ref({ user_id: '', type: 'multa', title: '', description: '' })
const alertMsg = ref('')
const alertType = ref('success')

let echoChannel = null
let notifChannel = null

const getUser = () => {
  const s = localStorage.getItem('user')
  return s ? JSON.parse(s) : null
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const formatTime = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
}

const showAlert = (msg, type = 'success') => {
  alertMsg.value = msg
  alertType.value = type
  setTimeout(() => { alertMsg.value = '' }, 3000)
}

const loadMessages = async () => {
  try {
    const res = await api.get('/messages')
    messages.value = res.data
    scrollToBottom()
  } catch (err) {
    if (err.response?.status === 401) {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      router.push('/login')
    }
  } finally {
    loading.value = false
  }
}

const loadUnreadCount = async () => {
  try {
    const res = await api.get('/notifications/unread-count')
    unreadCount.value = res.data.count
  } catch (e) {}
}

const loadUsers = async () => {
  try {
    const res = await api.get('/users')
    usersList.value = res.data
  } catch (e) {}
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || sending.value) return
  sending.value = true
  const text = newMessage.value
  newMessage.value = ''
  try {
    const res = await api.post('/messages', { message: text })
    messages.value.push(res.data)
    scrollToBottom()
    showAlert('✓ Mensaje enviado', 'success')
  } catch (err) {
    newMessage.value = text
    showAlert('✗ Error al enviar mensaje', 'error')
    if (err.response?.status === 401) {
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      router.push('/login')
    }
  } finally {
    sending.value = false
  }
}

const sendNotification = async () => {
  adminSending.value = true
  try {
    await api.post('/notifications', {
      user_id: adminForm.value.user_id,
      type: adminForm.value.type,
      title: adminForm.value.title,
      description: adminForm.value.description,
    })
    showAlert('✓ Notificación enviada correctamente', 'success')
    adminForm.value = { user_id: '', type: 'multa', title: '', description: '' }
  } catch (e) {
    showAlert('✗ Error al enviar notificación', 'error')
  } finally {
    adminSending.value = false
  }
}

const goToNotifications = () => {
  router.push('/notifications')
}

const goToUsers = () => {
  router.push('/users')
}

const logout = async () => {
  try { await api.post('/logout') } catch (e) {}
  localStorage.removeItem('user')
  localStorage.removeItem('token')
  router.push('/login')
}

onMounted(() => {
  currentUser.value = getUser()
  if (!currentUser.value) { router.push('/login'); return }

  loadMessages()
  loadUnreadCount()

  if (currentUser.value.role === 'admin') {
    loadUsers()
  }

  echoChannel = echo.channel('chat')
  echoChannel.listen('MessageSent', (data) => {
    if (!messages.value.find(m => m.id === data.id)) {
      messages.value.push(data)
      scrollToBottom()
    }
  })

  notifChannel = echo.channel('notifications.' + currentUser.value.id)
  notifChannel.listen('NotificationCreated', () => {
    unreadCount.value++
  })
})

onUnmounted(() => {
  if (echoChannel) echo.leave('chat')
  if (notifChannel) echo.leave('notifications.' + currentUser.value?.id)
})
</script>

<style scoped>
.chat-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  max-width: 550px;
  margin: 0 auto;
  background: #fff;
  border-left: 1px solid #ddd;
  border-right: 1px solid #ddd;
  position: relative;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #ddd;
  background: #f8f8f8;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-info {
  color: #666;
  font-size: 13px;
}

.admin-badge {
  background: #c00;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  margin-left: 6px;
  font-weight: bold;
}

.btn-notif {
  position: relative;
  padding: 5px 10px;
  background: none;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.btn-notif:hover { background: #f0f0f0; }

.badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #e00;
  color: white;
  font-size: 10px;
  font-weight: bold;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Transición bounce para el badge */
.bounce-enter-active { animation: bounce-in 0.4s; }
.bounce-leave-active { animation: bounce-in 0.3s reverse; }
@keyframes bounce-in {
  0% { transform: scale(0); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.btn-admin {
  padding: 5px 10px;
  background: none;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.btn-admin:hover { background: #f0f0f0; }

.btn-logout {
  padding: 5px 12px;
  background: none;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  color: #c00;
}

.btn-logout:hover { background: #fee; }

/* Transición slide-down para panel admin */
.slide-down-enter-active { transition: all 0.3s ease-out; }
.slide-down-leave-active { transition: all 0.2s ease-in; }
.slide-down-enter-from { transform: translateY(-10px); opacity: 0; }
.slide-down-leave-to { transform: translateY(-10px); opacity: 0; }

/* Admin Panel */
.admin-panel {
  padding: 12px 16px;
  background: #fffbe6;
  border-bottom: 1px solid #e0d89a;
}

.admin-panel h3 {
  font-size: 14px;
  margin: 0 0 10px;
}

.admin-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.admin-form select,
.admin-form input {
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 13px;
}

.admin-form button {
  padding: 8px;
  background: #c00;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  min-height: 34px;
}

.admin-form button:disabled { opacity: 0.5; cursor: not-allowed; }

/* Transición fade para texto de botones */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Messages */
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #f5f5f5;
}

.center-text {
  text-align: center;
  color: #999;
  margin-top: 40px;
}

.msg { display: flex; }
.msg.mine { justify-content: flex-end; }

.bubble {
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 12px;
  background: #e8e8e8;
  font-size: 14px;
}

.msg.mine .bubble {
  background: #4a90d9;
  color: white;
}

.name {
  display: block;
  font-size: 11px;
  font-weight: bold;
  color: #555;
  margin-bottom: 2px;
}

.text { word-wrap: break-word; }

.time {
  display: block;
  font-size: 10px;
  color: #999;
  margin-top: 3px;
  text-align: right;
}

.msg.mine .time { color: rgba(255,255,255,0.7); }

/* Input */
.input-bar {
  display: flex;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid #ddd;
  background: #f8f8f8;
}

.input-bar input {
  flex: 1;
  padding: 9px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.input-bar input:focus { outline: none; border-color: #4a90d9; }

.btn-send {
  padding: 9px 16px;
  background: #4a90d9;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  min-width: 70px;
}

.btn-send:disabled { opacity: 0.5; cursor: not-allowed; }

/* Toast / Alerta con transición */
.toast {
  position: absolute;
  bottom: 70px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  z-index: 50;
}

.toast.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.toast.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* Transición del toast */
.toast-enter-active { transition: all 0.3s ease-out; }
.toast-leave-active { transition: all 0.3s ease-in; }
.toast-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}
</style>
