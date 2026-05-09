import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

const API_URL = 'http://localhost:3000/api'

export const useQueueStore = defineStore('queue', () => {
  const senhas = ref([])
  const minhaSenha = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const fetchSenhas = async (token) => {
    loading.value = true
    error.value = null
    try {
      const response = await axios.get(`${API_URL}/senhas`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      senhas.value = response.data
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const fetchMinhaSenha = async (token) => {
    loading.value = true
    error.value = null
    try {
      const response = await axios.get(`${API_URL}/minha-senha`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      minhaSenha.value = response.data
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const criarSenha = async (tipo, token) => {
    loading.value = true
    error.value = null
    try {
      const response = await axios.post(`${API_URL}/senha`, { tipo }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      minhaSenha.value = response.data
      return response.data
    } catch (err) {
      error.value = err.response?.data?.erro || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const chamarProxima = async (token) => {
    loading.value = true
    error.value = null
    try {
      const response = await axios.put(`${API_URL}/senha/chamar`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      await fetchSenhas(token)
      return response.data
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const finalizarSenha = async (id, token) => {
    loading.value = true
    error.value = null
    try {
      const response = await axios.put(`${API_URL}/senha/finalizar/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      await fetchSenhas(token)
      return response.data
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const cancelarSenha = async (token) => {
    loading.value = true
    error.value = null
    try {
      const response = await axios.put(`${API_URL}/minha-senha/cancelar`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      minhaSenha.value = null
      return response.data
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  return {
    senhas,
    minhaSenha,
    loading,
    error,
    fetchSenhas,
    fetchMinhaSenha,
    criarSenha,
    chamarProxima,
    finalizarSenha,
    cancelarSenha
  }
})
