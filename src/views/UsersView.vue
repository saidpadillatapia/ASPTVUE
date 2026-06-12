<template>
  <div class="users-page">
    <div class="users-header">
      <button @click="goBack" class="btn-back">← Volver al chat</button>
      <h2>👥 Gestión de Usuarios</h2>
      <p class="subtitle">Panel de administrador - CRUD de usuarios</p>
    </div>

    <!-- Tabla de usuarios -->
    <div class="users-content">
      <div v-if="loading" class="center-text">Cargando usuarios...</div>

      <div v-else-if="users.length === 0" class="center-text">No hay usuarios registrados</div>

      <div v-else class="users-table-wrapper">
        <table class="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td>
                <span class="role-badge" :class="user.role">{{ user.role }}</span>
              </td>
              <td>
                <span class="status-badge" :class="user.email_verified_at ? 'active' : 'inactive'">
                  {{ user.email_verified_at ? '🟢 Activo' : '🔴 Inactivo' }}
                </span>
              </td>
              <td class="actions">
                <button @click="openEdit(user)" class="btn-edit" title="Editar">✏️</button>
                <button @click="toggleRole(user)" class="btn-role" title="Cambiar rol">
                  {{ user.role === 'admin' ? '👤' : '👑' }}
                </button>
                <button @click="confirmDelete(user)" class="btn-delete" title="Eliminar">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Editar Usuario -->
    <Transition name="modal">
      <div v-if="editModal" class="modal-overlay" @click="editModal = false">
        <div class="modal-box" @click.stop>
          <h3>Editar Usuario</h3>
          <div class="field">
            <label>Nombre</label>
            <input v-model="editForm.name" type="text" />
          </div>
          <div class="field">
            <label>Email</label>
            <input v-model="editForm.email" type="email" />
          </div>
          <div class="field">
            <label>Rol</label>
            <select v-model="editForm.role">
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div class="modal-actions">
            <button @click="editModal = false" class="btn-cancel">Cancelar</button>
            <button @click="saveEdit" :disabled="saving" class="btn-save">
              {{ saving ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Modal Confirmar Eliminar -->
    <Transition name="modal">
      <div v-if="deleteModal" class="modal-overlay" @click="deleteModal = false">
        <div class="modal-box" @click.stop>
          <h3>⚠️ Eliminar Usuario</h3>
          <p>¿Estás seguro de eliminar a <strong>{{ deleteTarget?.name }}</strong>?</p>
          <p class="modal-note">Esta acción no se puede deshacer.</p>
          <div class="modal-actions">
            <button @click="deleteModal = false" class="btn-cancel">Cancelar</button>
            <button @click="deleteUser" :disabled="saving" class="btn-delete-confirm">
              {{ saving ? 'Eliminando...' : 'Sí, Eliminar' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="alertMsg" class="toast" :class="alertType">{{ alertMsg }}</div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()
const users = ref([])
const loading = ref(true)
const saving = ref(false)
const editModal = ref(false)
const deleteModal = ref(false)
const deleteTarget = ref(null)
const alertMsg = ref('')
const alertType = ref('success')

const editForm = ref({ id: null, name: '', email: '', role: '' })

const showAlert = (msg, type = 'success') => {
  alertMsg.value = msg
  alertType.value = type
  setTimeout(() => { alertMsg.value = '' }, 3000)
}

const loadUsers = async () => {
  try {
    const res = await api.get('/users')
    users.value = res.data
  } catch (err) {
    showAlert('Error al cargar usuarios', 'error')
  } finally {
    loading.value = false
  }
}

const openEdit = (user) => {
  editForm.value = { id: user.id, name: user.name, email: user.email, role: user.role }
  editModal.value = true
}

const saveEdit = async () => {
  saving.value = true
  try {
    const res = await api.put('/users/' + editForm.value.id, {
      name: editForm.value.name,
      email: editForm.value.email,
      role: editForm.value.role,
    })
    // Actualizar la lista local
    const idx = users.value.findIndex(u => u.id === editForm.value.id)
    if (idx !== -1) {
      users.value[idx] = { ...users.value[idx], ...editForm.value }
    }
    editModal.value = false
    showAlert('✓ Usuario actualizado', 'success')
  } catch (err) {
    showAlert('✗ Error al actualizar: ' + (err.response?.data?.message || 'Error'), 'error')
  } finally {
    saving.value = false
  }
}

const toggleRole = async (user) => {
  const newRole = user.role === 'admin' ? 'user' : 'admin'
  try {
    await api.put('/users/' + user.id, { role: newRole })
    user.role = newRole
    showAlert(`✓ ${user.name} ahora es ${newRole}`, 'success')
  } catch (err) {
    showAlert('✗ Error al cambiar rol', 'error')
  }
}

const confirmDelete = (user) => {
  deleteTarget.value = user
  deleteModal.value = true
}

const deleteUser = async () => {
  saving.value = true
  try {
    await api.delete('/users/' + deleteTarget.value.id)
    users.value = users.value.filter(u => u.id !== deleteTarget.value.id)
    deleteModal.value = false
    showAlert('✓ Usuario eliminado', 'success')
  } catch (err) {
    showAlert('✗ Error al eliminar: ' + (err.response?.data?.message || 'Error'), 'error')
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  router.push('/chat')
}

onMounted(() => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  if (user.role !== 'admin') {
    router.push('/chat')
    return
  }
  loadUsers()
})
</script>

<style scoped>
.users-page {
  max-width: 800px;
  margin: 0 auto;
  min-height: 100vh;
  background: #fff;
  border-left: 1px solid #ddd;
  border-right: 1px solid #ddd;
}

.users-header {
  padding: 16px 20px;
  border-bottom: 1px solid #ddd;
  background: #f8f8f8;
}

.users-header h2 {
  margin: 8px 0 4px;
  font-size: 18px;
}

.subtitle {
  font-size: 12px;
  color: #888;
  margin: 0;
}

.btn-back {
  background: none;
  border: none;
  color: #4a90d9;
  cursor: pointer;
  font-size: 13px;
  padding: 0;
}

.btn-back:hover { text-decoration: underline; }

.users-content { padding: 16px; }

.center-text {
  text-align: center;
  color: #999;
  padding: 40px 0;
}

.users-table-wrapper { overflow-x: auto; }

.users-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.users-table th {
  background: #f0f0f0;
  padding: 10px 8px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #ddd;
}

.users-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #eee;
}

.users-table tr:hover { background: #fafafa; }

.role-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.role-badge.admin { background: #ffeeba; color: #856404; }
.role-badge.user { background: #d4edda; color: #155724; }

.status-badge {
  font-size: 12px;
  font-weight: 500;
}

.status-badge.active { color: #28a745; }
.status-badge.inactive { color: #dc3545; }

.actions {
  display: flex;
  gap: 4px;
}

.actions button {
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 14px;
}

.actions button:hover { background: #f0f0f0; }

/* Modales */
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
  padding: 24px;
  border-radius: 8px;
  max-width: 380px;
  width: 90%;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}

.modal-box h3 { margin: 0 0 16px; font-size: 16px; }
.modal-box p { font-size: 14px; color: #555; }

.modal-note {
  font-size: 12px !important;
  color: #999 !important;
  margin-top: 8px;
}

.field { margin-bottom: 12px; }
.field label { display: block; font-size: 12px; color: #666; margin-bottom: 4px; }
.field input, .field select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 13px;
  box-sizing: border-box;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
}

.btn-cancel {
  padding: 8px 16px;
  background: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.btn-save {
  padding: 8px 16px;
  background: #4a90d9;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.btn-save:disabled { opacity: 0.5; }

.btn-delete-confirm {
  padding: 8px 16px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.btn-delete-confirm:disabled { opacity: 0.5; }

/* Toast */
.toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  z-index: 200;
}

.toast.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
.toast.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }

/* Transiciones */
.modal-enter-active { transition: all 0.3s ease-out; }
.modal-leave-active { transition: all 0.2s ease-in; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

.toast-enter-active { transition: all 0.3s ease-out; }
.toast-leave-active { transition: all 0.3s ease-in; }
.toast-enter-from { opacity: 0; transform: translateX(-50%) translateY(20px); }
.toast-leave-to { opacity: 0; transform: translateX(-50%) translateY(-10px); }
</style>
