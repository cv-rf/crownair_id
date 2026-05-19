import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './stores/auth'
import App from './App.vue'
import './style.css'

import Dashboard from './views/Dashboard.vue'
import Login from './views/Login.vue'
import Members from './views/Members.vue'
import Regiments from './views/Regiments.vue'
import Certifications from './views/Certifications.vue'
import Applications from './views/Applications.vue'
import RankRequirements from './views/RankRequirements.vue'
import Settings from './views/Settings.vue'

const router = createRouter({
    history: createWebHistory(),
    routes: [
        // Login page is public
        { path: '/login', name: 'login', component: Login, meta: { requiresAuth: false } },
        
        // All internal dashboard pages require authentication
        { path: '/', name: 'dashboard', component: Dashboard, meta: { requiresAuth: true } },
        { path: '/members', name: 'members', component: Members, meta: { requiresAuth: true } },
        { path: '/regiments', name: 'regiments', component: Regiments, meta: { requiresAuth: true } },
        { path: '/certifications', name: 'certifications', component: Certifications, meta: { requiresAuth: true } },
        { path: '/applications', name: 'applications', component: Applications, meta: { requiresAuth: true } },
        { path: '/ranks', name: 'ranks', component: RankRequirements, meta: { requiresAuth: true } },
        { path: '/settings', name: 'settings', component: Settings, meta: { requiresAuth: true } },
    ]
})

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    if (authStore.loading) {
        await authStore.checkSession()
    }

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next({ name: 'login' })
    } else if (to.name === 'login' && authStore.isAuthenticated) {
        next({ name: 'dashboard' })
    } else {
        next()
    }
})

app.use(router)
app.mount('#app')