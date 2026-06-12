<template>
  <div class="verify-page">
    <div class="verify-box">
      <div v-if="loading" class="state">
        <div class="icon">⏳</div>
        <h2>Verificando correo...</h2>
        <p>Espera un momento</p>
      </div>

      <div v-else-if="success" class="state">
        <div class="icon">✅</div>
        <h2>¡Correo verificado!</h2>
        <p>Tu cuenta ahora está <strong>activa</strong>. Ya puedes iniciar sesión.</p>
        <button @click="goToLogin" class="btn-login">Ir a Iniciar Sesión</button>
      </div>

      <div v-else class="state">
        <div class="icon">❌</div>
        <h2>Error de verificación</h2>
        <p>{{ errorMsg }}</p>
        <button @click="goToLogin" class="btn-login">Volver al Login</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const loading = ref(true)
const success = ref(false)
const errorMsg = ref('')

onMounted(async () => {
  // La URL de verificación viene como query param ?url=...
  const verifyUrl = route.query.url

  if (!verifyUrl) {
    loading.value = false
    errorMsg.value = 'Link de verificación inválido o incompleto.'
    return
  }

  try {
    // Hacer la petición directamente a la URL de verificación de Laravel
    await axios.get(verifyUrl)
    success.value = true
  } catch (err) {
    if (err.response?.data?.message) {
      // Si dice "ya estaba verificado", también es éxito
      if (err.response.data.message.includes('ya')) {
        success.value = true
      } else {
        errorMsg.value = err.response.data.message
      }
    } else {
      errorMsg.value = 'No se pudo verificar. El link puede estar expirado.'
    }
  } finally {
    loading.value = false
  }
})

const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.verify-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eee;
}

.verify-box {
  background: white;
  padding: 40px;
  border-radius: 10px;
  text-align: center;
  max-width: 380px;
  width: 90%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.state .icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.state h2 {
  font-size: 20px;
  margin-bottom: 8px;
}

.state p {
  font-size: 14px;
  color: #555;
  margin-bottom: 20px;
}

.btn-login {
  padding: 10px 24px;
  background: #4a90d9;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.btn-login:hover {
  background: #3a7bc8;
}
</style>
