import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { getTier } from './config/permissions'
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
        { path: '/login', name: 'login', component: Login, meta: { requiresAuth: false } },

        { path: '/',                name: 'dashboard',        component: Dashboard,        meta: { requiresAuth: true, minTier: 1 } },
        { path: '/members',         name: 'members',          component: Members,          meta: { requiresAuth: true, minTier: 2 } },
        { path: '/regiments',       name: 'regiments',        component: Regiments,        meta: { requiresAuth: true, minTier: 1 } },
        { path: '/certifications',  name: 'certifications',   component: Certifications,   meta: { requiresAuth: true, minTier: 1 } },
        { path: '/applications',    name: 'applications',     component: Applications,     meta: { requiresAuth: true, minTier: 1 } },
        { path: '/ranks',           name: 'ranks',            component: RankRequirements, meta: { requiresAuth: true, minTier: 5 } },
        { path: '/settings',        name: 'settings',         component: Settings,         meta: { requiresAuth: true, minTier: 5 } },
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
        return next({ name: 'login' })
    }

    if (to.meta.minTier) {
        const tier = getTier(authStore.user?.rankId ?? 0)
        if (tier < to.meta.minTier) {
            return next({ name: 'dashboard' })
        }
    }

    if (to.name === 'login' && authStore.isAuthenticated) {
        return next({ name: 'dashboard' })
    }

    next()
})

app.use(router)
app.mount('#app')