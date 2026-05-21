<template>
  <div class="chat-page">
    <!-- Header -->
    <div class="header">
      <div>
        <strong>Chat en Vivo</strong>
        <span class="user-info">— {{ currentUser?.name }}</span>
      </div>
      <button @click="logout" class="btn-logout">Cerrar sesión</button>
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

    <!-- Input -->
    <div class="input-bar">
      <input
        v-model="newMessage"
        @keyup.enter="sendMessage"
        placeholder="Escribe un mensaje..."
        :disabled="sending"
      />
      <button @click="sendMessage" :disabled="!newMessage.trim() || sending">Enviar</button>
    </div>
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
let echoChannel = null

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

const sendMessage = async () => {
  if (!newMessage.value.trim() || sending.value) return
  sending.value = true
  const text = newMessage.value
  newMessage.value = ''
  try {
    const res = await api.post('/messages', { message: text })
    messages.value.push(res.data)
    scrollToBottom()
  } catch (err) {
    newMessage.value = text
    if (err.response?.status === 401) {
      localStorage.removeItem('user')
      router.push('/login')
    }
  } finally {
    sending.value = false
  }
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
  echoChannel = echo.channel('chat')
  echoChannel.listen('MessageSent', (data) => {
    if (!messages.value.find(m => m.id === data.id)) {
      messages.value.push(data)
      scrollToBottom()
    }
  })
})

onUnmounted(() => { if (echoChannel) echo.leave('chat') })
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
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #ddd;
  background: #f8f8f8;
}

.user-info {
  color: #666;
  font-size: 13px;
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

.input-bar button {
  padding: 9px 16px;
  background: #4a90d9;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.input-bar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
