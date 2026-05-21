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

        <p v-if="error" class="error">{{ error }}</p>

        <button type="submit" :disabled="loading">
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <div class="hint">
        <p><b>Usuarios de prueba:</b></p>
        <p>said@test.com / 123456</p>
        <p>test@test.com / 123456</p>
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

const login = async () => {
  error.value = ''
  loading.value = true
  try {
    const res = await api.post('/login', {
      email: email.value,
      password: password.value,
    })
    localStorage.setItem('user', JSON.stringify(res.data.user))
    router.push('/chat')
  } catch (err) {
    error.value = err.response?.status === 401 ? 'Credenciales incorrectas' : 'Error de conexión'
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

.error {
  color: red;
  font-size: 13px;
  margin-bottom: 10px;
}

button {
  width: 100%;
  padding: 10px;
  background: #4a90d9;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

button:hover:not(:disabled) {
  background: #3a7bc8;
}

button:disabled {
  opacity: 0.6;
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
