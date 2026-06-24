<template>
  <div class="forgot-page">
    <div class="forgot-box">

      <!-- PASO 1: Pedir email -->
      <div v-if="step === 1">
        <h2>🔑 Recuperar Contraseña</h2>
        <p class="subtitle">Ingresa tu correo y te enviaremos un código de 6 dígitos</p>

        <form @submit.prevent="sendCode">
          <div class="field">
            <label>Correo electrónico</label>
            <input v-model="email" type="email" placeholder="correo@ejemplo.com" required />
          </div>

          <Transition name="fade">
            <p v-if="error" class="error">{{ error }}</p>
          </Transition>

          <button type="submit" :disabled="loading" class="btn-primary">
            {{ loading ? '⏳ Enviando...' : 'Enviar Código' }}
          </button>
        </form>
      </div>

      <!-- PASO 2: Ingresar código -->
      <div v-if="step === 2">
        <h2>📧 Código Enviado</h2>
        <p class="subtitle">Revisa tu correo <strong>{{ email }}</strong> e ingresa el código de 6 dígitos</p>

        <form @submit.prevent="verifyCode">
          <div class="field">
            <label>Código de verificación</label>
            <input 
              v-model="code" 
              type="text" 
              placeholder="000000" 
              maxlength="6" 
              required 
              class="code-input"
            />
          </div>

          <Transition name="fade">
            <p v-if="error" class="error">{{ error }}</p>
          </Transition>

          <button type="submit" :disabled="loading" class="btn-primary">
            {{ loading ? '⏳ Verificando...' : 'Verificar Código' }}
          </button>
        </form>

        <button @click="sendCode" class="btn-link">¿No te llegó? Reenviar código</button>
      </div>

      <!-- PASO 3: Nueva contraseña -->
      <div v-if="step === 3">
        <h2>🔒 Nueva Contraseña</h2>
        <p class="subtitle">El código es correcto. Ingresa tu nueva contraseña.</p>

        <form @submit.prevent="resetPassword">
          <div class="field">
            <label>Nueva contraseña (mínimo 8 caracteres)</label>
            <input v-model="password" type="password" placeholder="••••••••" required minlength="8" />
          </div>

          <div class="field">
            <label>Confirmar contraseña</label>
            <input v-model="password_confirmation" type="password" placeholder="••••••••" required />
          </div>

          <Transition name="fade">
            <p v-if="error" class="error">{{ error }}</p>
          </Transition>

          <button type="submit" :disabled="loading" class="btn-primary btn-green">
            {{ loading ? '⏳ Guardando...' : 'Cambiar Contraseña' }}
          </button>
        </form>
      </div>

      <!-- Link volver -->
      <p class="back-link">
        <router-link to="/login">← Volver al Login</router-link>
      </p>

      <!-- Alerta -->
      <Transition name="slide-up">
        <div v-if="alertMsg" class="alert" :class="alertType">{{ alertMsg }}</div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()
const step = ref(1)
const email = ref('')
const code = ref('')
const password = ref('')
const password_confirmation = ref('')
const loading = ref(false)
const error = ref('')
const alertMsg = ref('')
const alertType = ref('success')

const showAlert = (msg, type = 'success') => {
  alertMsg.value = msg
  alertType.value = type
  setTimeout(() => { alertMsg.value = '' }, 4000)
}

// PASO 1: Enviar código al correo
const sendCode = async () => {
  error.value = ''
  loading.value = true
  try {
    await api.post('/password/send-code', { email: email.value })
    showAlert('✓ Código enviado a tu correo', 'success')
    step.value = 2
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al enviar código'
    showAlert('✗ ' + error.value, 'error')
  } finally {
    loading.value = false
  }
}

// PASO 2: Verificar código
const verifyCode = async () => {
  error.value = ''
  loading.value = true
  try {
    await api.post('/password/verify-code', { email: email.value, code: code.value })
    showAlert('✓ Código correcto', 'success')
    step.value = 3
  } catch (err) {
    error.value = err.response?.data?.message || 'Código incorrecto'
    showAlert('✗ ' + error.value, 'error')
  } finally {
    loading.value = false
  }
}

// PASO 3: Cambiar contraseña
const resetPassword = async () => {
  error.value = ''

  if (password.value !== password_confirmation.value) {
    error.value = 'Las contraseñas no coinciden'
    return
  }

  loading.value = true
  try {
    const res = await api.post('/password/reset', {
      email: email.value,
      code: code.value,
      password: password.value,
      password_confirmation: password_confirmation.value,
    })
    showAlert('✓ ' + res.data.message, 'success')
    setTimeout(() => { router.push('/login') }, 2000)
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al cambiar contraseña'
    showAlert('✗ ' + error.value, 'error')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.forgot-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eee;
}

.forgot-box {
  background: white;
  padding: 30px;
  border-radius: 8px;
  width: 360px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.forgot-box h2 { margin: 0 0 4px; font-size: 18px; }
.subtitle { font-size: 13px; color: #666; margin-bottom: 20px; }

.field { margin-bottom: 14px; }
.field label { display: block; font-size: 13px; margin-bottom: 4px; color: #333; }
.field input {
  width: 100%;
  padding: 9px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}
.field input:focus { outline: none; border-color: #4a90d9; }

.code-input {
  font-size: 24px !important;
  letter-spacing: 8px;
  text-align: center;
  font-weight: bold;
}

.error { color: red; font-size: 13px; margin-bottom: 10px; }

.btn-primary {
  width: 100%;
  padding: 10px;
  background: #4a90d9;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}
.btn-primary:hover:not(:disabled) { background: #3a7bc8; }
.btn-primary:disabled { opacity: 0.6; }
.btn-green { background: #28a745; }
.btn-green:hover:not(:disabled) { background: #218838; }

.btn-link {
  background: none;
  border: none;
  color: #4a90d9;
  cursor: pointer;
  font-size: 12px;
  margin-top: 10px;
  display: block;
  text-align: center;
  width: 100%;
}
.btn-link:hover { text-decoration: underline; }

.back-link {
  text-align: center;
  margin-top: 16px;
  font-size: 13px;
}
.back-link a { color: #4a90d9; text-decoration: none; }
.back-link a:hover { text-decoration: underline; }

.alert {
  margin-top: 12px;
  padding: 10px;
  border-radius: 4px;
  font-size: 13px;
  text-align: center;
}
.alert.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
.alert.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.slide-up-enter-active { transition: all 0.3s ease-out; }
.slide-up-leave-active { transition: all 0.3s ease-in; }
.slide-up-enter-from { opacity: 0; transform: translateY(10px); }
.slide-up-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
