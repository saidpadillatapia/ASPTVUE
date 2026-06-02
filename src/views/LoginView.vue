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

        <!-- Botón con Transition para estado cargando -->
        <button type="submit" :disabled="loading" class="btn-login">
          <Transition name="fade" mode="out-in">
            <span v-if="loading" key="loading" class="loading-text">⏳ Cargando...</span>
            <span v-else key="idle">Entrar</span>
          </Transition>
        </button>
      </form>

      <!-- Alerta con Transition para mostrar resultado -->
      <Transition name="slide-fade">
        <div v-if="alert.show" :class="['alert', alert.type]">
          {{ alert.message }}
        </div>
      </Transition>

      <div class="hint">
        <p><b>Usuarios de prueba:</b></p>
        <p>said@test.com / 123456</p>
        <p>test@test.com / 123456</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)

const alert = reactive({
  show: false,
  message: '',
  type: 'success' // 'success' o 'error'
})

const showAlert = (message, type = 'success') => {
  alert.show = true
  alert.message = message
  alert.type = type
  setTimeout(() => { alert.show = false }, 3000)
}

const login = async () => {
  loading.value = true
  alert.show = false

  try {
    const res = await api.post('/login', {
      email: email.value,
      password: password.value,
    })
    localStorage.setItem('user', JSON.stringify(res.data.user))
    showAlert('Bienvenido, ' + res.data.user.name, 'success')
    setTimeout(() => router.push('/chat'), 1000)
  } catch (err) {
    const msg = err.response?.status === 401 ? 'Credenciales incorrectas' : 'Error de conexión'
    showAlert(msg, 'error')
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

/* Botón de login */
.btn-login {
  width: 100%;
  padding: 10px;
  background: #4a90d9;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  margin-top: 6px;
}

.btn-login:hover:not(:disabled) {
  background: #3a7bc8;
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-text {
  display: inline-block;
}

/* Transición fade para el texto del botón */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Transición slide-fade para la alerta */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s ease-in;
}

.slide-fade-enter-from {
  transform: translateY(-10px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateY(10px);
  opacity: 0;
}

/* Alerta */
.alert {
  margin-top: 14px;
  padding: 10px 12px;
  border-radius: 4px;
  font-size: 13px;
  text-align: center;
}

.alert.success {
  background: #e6f9e6;
  color: #1a7a1a;
  border: 1px solid #b3e6b3;
}

.alert.error {
  background: #fde8e8;
  color: #c00;
  border: 1px solid #f5c2c2;
}

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
