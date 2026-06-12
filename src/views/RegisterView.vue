<template>
  <div class="register-page">
    <div class="register-box">
      <h2>Crear Cuenta</h2>
      <p class="subtitle">ASPT - Registro de Usuario</p>

      <form @submit.prevent="register">
        <div class="field">
          <label>Nombre completo</label>
          <input v-model="form.name" type="text" placeholder="Tu nombre" required />
        </div>

        <div class="field">
          <label>Correo electrónico</label>
          <input v-model="form.email" type="email" placeholder="correo@ejemplo.com" required />
        </div>

        <div class="field">
          <label>Contraseña (mínimo 8 caracteres)</label>
          <input v-model="form.password" type="password" placeholder="••••••••" required minlength="8" />
        </div>

        <div class="field">
          <label>Confirmar contraseña</label>
          <input v-model="form.password_confirmation" type="password" placeholder="••••••••" required />
        </div>

        <Transition name="fade">
          <p v-if="error" class="error">{{ error }}</p>
        </Transition>

        <button type="submit" :disabled="loading" class="btn-register">
          <Transition name="fade" mode="out-in">
            <span v-if="loading" key="loading">⏳ Registrando...</span>
            <span v-else key="normal">Registrarme</span>
          </Transition>
        </button>
      </form>

      <p class="login-link">
        ¿Ya tienes cuenta? <router-link to="/login">Inicia sesión</router-link>
      </p>

      <!-- Alerta -->
      <Transition name="slide-up">
        <div v-if="alertMsg" class="alert" :class="alertType">{{ alertMsg }}</div>
      </Transition>
    </div>

    <!-- Modal de éxito -->
    <Transition name="modal">
      <div v-if="showSuccess" class="modal-overlay" @click="goToLogin">
        <div class="modal-box" @click.stop>
          <div class="modal-icon">📧</div>
          <h3>¡Registro exitoso!</h3>
          <p>Hemos enviado un correo de verificación a:</p>
          <p class="email-highlight">{{ form.email }}</p>
          <p class="modal-note">Tu cuenta estará <strong>inactiva</strong> hasta que verifiques tu correo. Revisa tu bandeja de entrada (o spam).</p>
          <button @click="goToLogin" class="btn-go-login">Ir a Iniciar Sesión</button>
        </div>
      </div>
    </Transition>
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
const showSuccess = ref(false)

const form = ref({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
})

const showAlert = (msg, type = 'success') => {
  alertMsg.value = msg
  alertType.value = type
  setTimeout(() => { alertMsg.value = '' }, 4000)
}

const register = async () => {
  error.value = ''

  // Validar que las contraseñas coincidan
  if (form.value.password !== form.value.password_confirmation) {
    error.value = 'Las contraseñas no coinciden'
    return
  }

  if (form.value.password.length < 8) {
    error.value = 'La contraseña debe tener al menos 8 caracteres'
    return
  }

  loading.value = true
  try {
    const res = await api.post('/register', form.value)
    
    // NO guardamos token ni user aún porque el email no está verificado
    showSuccess.value = true
    showAlert('✓ Cuenta creada. Revisa tu correo.', 'success')
  } catch (err) {
    if (err.response?.status === 422) {
      // Errores de validación de Laravel
      const errors = err.response.data.errors
      if (errors) {
        const firstError = Object.values(errors)[0]
        error.value = Array.isArray(firstError) ? firstError[0] : firstError
      } else {
        error.value = err.response.data.message || 'Error de validación'
      }
    } else {
      error.value = 'Error de conexión con el servidor'
    }
    showAlert('✗ ' + error.value, 'error')
  } finally {
    loading.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eee;
}

.register-box {
  background: white;
  padding: 30px;
  border-radius: 8px;
  width: 360px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  position: relative;
}

.register-box h2 {
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
  box-sizing: border-box;
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

.btn-register {
  width: 100%;
  padding: 10px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  min-height: 40px;
}

.btn-register:hover:not(:disabled) {
  background: #218838;
}

.btn-register:disabled {
  opacity: 0.6;
}

.login-link {
  text-align: center;
  margin-top: 16px;
  font-size: 13px;
  color: #666;
}

.login-link a {
  color: #4a90d9;
  text-decoration: none;
  font-weight: 500;
}

.login-link a:hover {
  text-decoration: underline;
}

/* Modal de éxito */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-box {
  background: white;
  padding: 30px;
  border-radius: 10px;
  text-align: center;
  max-width: 360px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}

.modal-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.modal-box h3 {
  font-size: 18px;
  margin-bottom: 10px;
  color: #28a745;
}

.modal-box p {
  font-size: 14px;
  color: #555;
  margin: 6px 0;
}

.email-highlight {
  font-weight: bold;
  color: #4a90d9;
  font-size: 15px !important;
}

.modal-note {
  margin-top: 12px !important;
  font-size: 12px !important;
  color: #888 !important;
  background: #f8f8f8;
  padding: 10px;
  border-radius: 4px;
}

.btn-go-login {
  margin-top: 16px;
  padding: 10px 24px;
  background: #4a90d9;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.btn-go-login:hover {
  background: #3a7bc8;
}

/* Alertas */
.alert {
  margin-top: 12px;
  padding: 10px;
  border-radius: 4px;
  font-size: 13px;
  text-align: center;
}

.alert.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
.alert.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

/* Transiciones */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active { transition: all 0.3s ease-out; }
.slide-up-leave-active { transition: all 0.3s ease-in; }
.slide-up-enter-from { opacity: 0; transform: translateY(10px); }
.slide-up-leave-to { opacity: 0; transform: translateY(-10px); }

.modal-enter-active { transition: all 0.3s ease-out; }
.modal-leave-active { transition: all 0.2s ease-in; }
.modal-enter-from { opacity: 0; }
.modal-leave-to { opacity: 0; }
.modal-enter-from .modal-box { transform: scale(0.9); }
</style>
