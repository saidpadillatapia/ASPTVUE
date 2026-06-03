<template>
  <div class="login-page">
    <div class="login-box">
      <h2>Iniciar Sesión</h2>
      <p class="subtitle">Chat en Tiempo Real</p>

      <form @submit.prevent="login">
        <div class="field">
          <label>Correo</label>
          <input v-model="email" type="email" placeholder="correo@ejemplo.com" required />
        </div>

        <div class="field">
          <label>Contraseña</label>
          <input v-model="password" type="password" placeholder="••••••" required />
        </div>

        <Transition name="fade">
          <p v-if="error" class="error">{{ error }}</p>
        </Transition>

        <button type="submit" :disabled="loading" class="btn-login">
          <Transition name="fade" mode="out-in">
            <span v-if="loading" key="loading">⏳ Verificando...</span>
            <span v-else key="normal">Entrar</span>
          </Transition>
        </button>
      </form>

      <!-- Alerta de resultado -->
      <Transition name="slide-up">
        <div v-if="alertMsg" class="alert" :class="alertType">{{ alertMsg }}</div>
      </Transition>

      <div class="hint">
        <p><b>Usuarios de prueba:</b></p>
        <p>admin@test.com / 123456 (Admin)</p>
        <p>said@test.com / 123456</p>
        <p>karol@test.com / 123456</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const alertMsg = ref('')
const alertType = ref('success')

const showAlert = (msg, type = 'success') => {
  alertMsg.value = msg
  alertType.value = type
  setTimeout(() => { alertMsg.value = '' }, 3000)
}

const login = async () => {
  error.value = ''
  loading.value = true
  try {
    const res = await api.post('/login', {
      email: email.value,
      password: password.value,
    })
    showAlert('✓ Bienvenido, ' + res.data.user.name, 'success')
    localStorage.setItem('user', JSON.stringify(res.data.user))
    setTimeout(() => { router.push('/chat') }, 800)
  } catch (err) {
    if (err.response?.status === 401) {
      error.value = 'Credenciales incorrectas'
      showAlert('✗ Credenciales incorrectas', 'error')
    } else {
      error.value = 'Error de conexión'
      showAlert('✗ Error de conexión con el servidor', 'error')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eee;
}

.login-box {
  background: white;
  padding: 30px;
  border-radius: 8px;
  width: 320px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  position: relative;
}

.login-box h2 {
  margin: 0 0 4px;
  font-size: 20px;
}

.subtitle {
  color: #666;
  font-size: 13px;
  margin-bottom: 20px;
}

.field {
  margin-bottom: 14px;
}

.field label {
  display: block;
  font-size: 13px;
  margin-bottom: 4px;
  color: #333;
}

.field input {
  width: 100%;
  padding: 9px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.field input:focus {
  outline: none;
  border-color: #4a90d9;
}

.error {
  color: red;
  font-size: 13px;
  margin-bottom: 10px;
}

.btn-login {
  width: 100%;
  padding: 10px;
  background: #4a90d9;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  min-height: 40px;
}

.btn-login:hover:not(:disabled) {
  background: #3a7bc8;
}

.btn-login:disabled {
  opacity: 0.6;
}

/* Alerta */
.alert {
  margin-top: 12px;
  padding: 10px;
  border-radius: 4px;
  font-size: 13px;
  text-align: center;
}

.alert.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

/* Transición fade */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Transición slide-up para alerta */
.slide-up-enter-active { transition: all 0.3s ease-out; }
.slide-up-leave-active { transition: all 0.3s ease-in; }
.slide-up-enter-from { opacity: 0; transform: translateY(10px); }
.slide-up-leave-to { opacity: 0; transform: translateY(-10px); }

.hint {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid #eee;
  font-size: 12px;
  color: #888;
}

.hint p {
  margin: 2px 0;
}
</style>
