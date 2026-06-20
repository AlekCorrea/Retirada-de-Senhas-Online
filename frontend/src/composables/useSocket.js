import { ref, onUnmounted } from 'vue'
import { io } from 'socket.io-client'

const socket = ref(null)
const connected = ref(false)

export function useSocket() {
  const connect = () => {
    if (socket.value) return

  socket.value = io(import.meta.env.VITE_API_URL, {
  transports: ['websocket', 'polling']
    })

    socket.value.on('connect', () => {
      connected.value = true
      console.log('✅ Socket conectado')
    })

    socket.value.on('disconnect', () => {
      connected.value = false
      console.log('❌ Socket desconectado')
    })
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      connected.value = false
    }
  }

  const registerDevice = (deviceId, role = 'user') => {
    if (socket.value && deviceId) {
      socket.value.emit('register-device', { deviceId, role })
    }
  }

  const joinAdmin = () => {
    if (socket.value) {
      socket.value.emit('join-admin')
    }
  }

  const registerAttendant = (user) => {
    if (socket.value && user?.id) {
      socket.value.emit('register-attendant', { userId: user.id, nome: user.nome })
    }
  }

  const unregisterAttendant = () => {
    if (socket.value) {
      socket.value.emit('unregister-attendant')
    }
  }

  const on = (event, callback) => {
    if (socket.value) {
      socket.value.on(event, callback)
    }
  }

  const off = (event, callback) => {
    if (socket.value) {
      socket.value.off(event, callback)
    }
  }

  const emit = (event, data) => {
    if (socket.value) {
      socket.value.emit(event, data)
    }
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    socket,
    connected,
    connect,
    disconnect,
    registerDevice,
    joinAdmin,
    registerAttendant,
    unregisterAttendant,
    on,
    off,
    emit
  }
}
