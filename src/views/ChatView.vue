<template>
  <div class="chat-page">
    <!-- Header -->
    <div class="header">
      <div>
        <strong>Chat en Vivo</strong>
        <span class="user-info">— {{ currentUser?.name }}</span>
      </div>
      <div class="header-actions">
        <!-- Botón de notificaciones con Transition en el badge -->
        <button @click="goToNotifications" class="btn-notif">
          🔔
          <Transition name="bounce">
            <span v-if="unreadCount > 0" :key="unreadCount" class="badge">{{ unreadCount }}</span>
          </Transition>
        </button>
        <button @click="logout" class="btn-logout">Cerrar sesión</button>
      </div>
    </div>

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

    <!-- Input con Transition en el botón enviar -->
    <div class="input-bar">
      <input
        v-model="newMessage"
        @keyup.enter="sendMessage"
        placeholder="Escribe un mensaje..."
        :disabled="sending"
      />
      <button @click="sendMessage" :disabled="!newMessage.trim() || sending" class="btn-send">
        <Transition name="fade" mode="out-in">
          <span v-if="sending" key="sending">⏳</span>
          <span v-else key="send">Enviar</span>
        </Transition>
      </button>
    </div>

    <!-- Alerta con Transition para confirmación de envío -->
    <Transition name="slide-up">
      <div v-if="alertMsg" class="toast">{{ alertMsg }}</div>
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
const alertMsg = ref('')
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

const showToast = (msg) => {
  alertMsg.value = msg
  setTimeout(() => { alertMsg.value = '' }, 2000)
}

const loadMessages = async () => {
  try {
    const res = await api.get('/messages')
    messages.value = res.data
    scrollToBottom()
  } catch (err) {
    if (err.response?.status === 401) {
      localStorage.removeItem('user')
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

const sendMessage = async () => {
  if (!newMessage.value.trim() || sending.value) return
  sending.value = true
  const text = newMessage.value
  newMessage.value = ''
  try {
    const res = await api.post('/messages', { message: text })
    messages.value.push(res.data)
    scrollToBottom()
    showToast('Mensaje enviado ✓')
  } catch (err) {
    newMessage.value = text
    showToast('Error al enviar ✗')
    if (err.response?.status === 401) {
      localStorage.removeItem('user')
      router.push('/login')
    }
  } finally {
    sending.value = false
  }
}

const goToNotifications = () => {
  router.push('/notifications')
}

const logout = async () => {
  try { await api.post('/logout') } catch (e) {}
  localStorage.removeItem('user')
  router.push('/login')
}

onMounted(() => {
  currentUser.value = getUser()
  if (!currentUser.value) { router.push('/login'); return }

  loadMessages()
  loadUnreadCount()

  // Escuchar mensajes del chat
  echoChannel = echo.channel('chat')
  echoChannel.listen('MessageSent', (data) => {
    if (!messages.value.find(m => m.id === data.id)) {
      messages.value.push(data)
      scrollToBottom()
    }
  })

  // Escuchar notificaciones en tiempo real
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

.btn-notif {
  position: relative;
  padding: 5px 10px;
  background: none;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.btn-notif:hover {
  background: #f0f0f0;
}

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

/* Transición bounce para el badge de notificaciones */
.bounce-enter-active {
  animation: bounce-in 0.4s;
}

.bounce-leave-active {
  animation: bounce-in 0.3s reverse;
}

@keyframes bounce-in {
  0% { transform: scale(0); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.btn-logout {
  padding: 5px 12px;
  background: none;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  color: #c00;
}

.btn-logout:hover {
  background: #fee;
}

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

.msg {
  display: flex;
}

.msg.mine {
  justify-content: flex-end;
}

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

.text {
  word-wrap: break-word;
}

.time {
  display: block;
  font-size: 10px;
  color: #999;
  margin-top: 3px;
  text-align: right;
}

.msg.mine .time {
  color: rgba(255,255,255,0.7);
}

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

.input-bar input:focus {
  outline: none;
  border-color: #4a90d9;
}

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

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Transición fade para el texto del botón enviar */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Toast de confirmación */
.toast {
  position: absolute;
  bottom: 70px;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
}

/* Transición slide-up para el toast */
.slide-up-enter-active {
  transition: all 0.3s ease-out;
}

.slide-up-leave-active {
  transition: all 0.3s ease-in;
}

.slide-up-enter-from {
  transform: translate(-50%, 20px);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translate(-50%, -10px);
  opacity: 0;
}
</style>
