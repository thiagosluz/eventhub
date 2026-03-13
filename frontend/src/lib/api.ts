import axios from "axios"
import { parseCookies } from "nookies"

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333", // Default NestJS port
})

api.interceptors.request.use((config) => {
  const cookies = parseCookies()
  const token = cookies["eventhub.token"]

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})
