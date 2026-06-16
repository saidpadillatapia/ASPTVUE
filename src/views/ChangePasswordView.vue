<template>
  <div class="password-page">
    <div class="password-box">
      <button @click="goBack" class="btn-back">← Volver al chat</button>
      <h2>🔒 Cambiar Contraseña</h2>
      <p class="subtitle">Al cambiar tu contraseña se cerrará sesión en todos tus dispositivos.</p>

      <form @submit.prevent="changePassword">
        <div class="field">
          <label>Contraseña actual</label>
          <input v-model="form.current_password" type="password" placeholder="••••••••" required />
        </div>

        <div class="field">
          <label>Nueva contraseña (mínimo 8 caracteres)</label>
          <input v-model="form.new_password" type="password" placeholder="••••••••" required minlength="8" />
        </div>

        <div class="field">
          <label>Confirmar nueva contraseña</label>
          <input v-model="form.new_password_confirmation" type="password" placeholder="••••••••" required />
        </div>

        <Transition name="fade">
          <p v-if="error" class="error">{{ error }}</p>
        </Transition>

        <button type="submit" :disabled="loading" class="btn-submit">
          {{ loading ? '⏳ Cambiando...' : 'Cambiar Contraseña' }}
        </button>
      </form>

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
const loading = ref(false)
const error = ref('')
const alertMsg = ref('')
const alertType = ref('success')

const form = ref({
  current_password: '',
  new_password: '',
  new_password_confirmation: '',
})

const showAlert = (msg, type = 'success') => {
  alertMsg.value = msg
  alertType.value = type
  setTimeout(() => { alertMsg.value = '' }, 4000)
}

const changePassword = async () => {
  error.value = ''

  if (form.value.new_password !== form.value.new_password_confirmation) {
    error.value = 'Las contraseñas nuevas no coinciden'
    return
  }

  if (form.value.new_password.length < 8) {
    error.value = 'La nueva contraseña debe tener al menos 8 caracteres'
    return
  }

  loading.value = true
  try {
    const res = await api.post('/change-password', form.value)
    showAlert('✓ ' + res.data.message, 'success')

    // Se cerraron todas las sesiones, redirigir a login después de 2 segundos
    setTimeout(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }, 2000)
  } catch (err) {
    if (err.response?.status === 422) {
      error.value = err.response.data.message || 'La contraseña actual es incorrecta'
    } else {
      error.value = 'Error de conexión'
    }
    showAlert('✗ ' + error.value, 'error')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/chat')
}
</script>

<style scoped>
.password-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eee;
}

.password-box {
  background: white;
  padding: 30px;
  border-radius: 8px;
  width: 360px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.password-box h2 { margin: 10px 0 4px; font-size: 18px; }
.subtitle { font-size: 12px; color: #888; margin-bottom: 20px; }

.btn-back {
  background: none;
  border: none;
  color: #4a90d9;
  cursor: pointer;
  font-size: 13px;
  padding: 0;
}
.btn-back:hover { text-decoration: underline; }

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

.error { color: red; font-size: 13px; margin-bottom: 10px; }

.btn-submit {
  width: 100%;
  padding: 10px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}
.btn-submit:hover:not(:disabled) { background: #c82333; }
.btn-submit:disabled { opacity: 0.6; }

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
