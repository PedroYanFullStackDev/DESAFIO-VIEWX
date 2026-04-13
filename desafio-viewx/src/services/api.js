import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 60000,
})

export const fetchReels = async (username, platform) => {
  const { data } = await api.get(`/reels/${username}`, {
    params: { platform },
  })
  
  if (data.success === false) {
    // Lança um erro controlado para o React Query capturar
    const error = new Error(data.error || 'Falha ao buscar dados')
    error.response = { status: data.code === 'INSTAGRAM_BLOCKED' ? 403 : 404, data: data }
    throw error
  }
  
  return data
}

export default api
