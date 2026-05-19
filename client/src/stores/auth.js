import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
    const user = ref(null)
    const isAuthenticated = ref(false)
    const loading = ref(true)

    async function checkSession() {
        loading.value = true
        try {
            const res = await fetch('http://localhost:3000/api/auth/me', { credentials: 'include' })
            const data = await res.json()

            if (data.authenticated) {
                user.value = data.user
                isAuthenticated.value = true
            } else {
                user.value = null
                isAuthenticated.value = false
            }
        } catch (err) {
            console.error(`Session validation failed:`, err)
        } finally {
            loading.value = false
        }
    }

    return { user, isAuthenticated, loading, checkSession }
})