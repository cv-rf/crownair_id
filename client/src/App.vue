<script setup>
import { onMounted, ref } from 'vue'
import { useAuthStore } from './stores/auth'
import { usePermissions } from './composables/usePermissions'
import NavItem from './components/NavItem.vue'

const authStore = useAuthStore()
const { can } = usePermissions()

onMounted(async () => {
    await authStore.checkSession()
})
</script>

<template>
    <div v-if="authStore.isAuthenticated" class="flex min-h-screen bg-slate-100">
        <!-- Sidebar -->
        <aside class="w-64 bg-white rounded-2xl m-3 p-4 flex flex-col gap-1 shadow-sm shrink-0">
            <div class="px-3 py-4 mb-2">
                <h1 class="text-lg font-bold text-slate-800">ARAF ID</h1>
                <p class="text-xs text-slate-400 mt-0.5">Personnel Management</p>
            </div>

            <NavItem to="/" icon="dashboard" label="Dashboard" />
            <NavItem v-if="can('VIEW_MEMBER_LIST')" to="/members" icon="group" label="Members" />
            <NavItem to="/regiments" icon="military_tech" label="Regiments" />
            <NavItem to="/certifications" icon="verified" label="Certifications" />
            <NavItem to="/applications" icon="assignment" label="Applications" />
            <NavItem v-if="can('MANAGE_RANK_REQS')" to="/ranks" icon="leaderboard" label="Rank Requirements" />

            <div class="mt-auto flex flex-col gap-4">
                <NavItem to="/settings" icon="settings" label="Settings" />

                <div class="h-px bg-slate-100 mx-2"></div>

                <div class="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100/80">
                    <div class="relative w-11 h-11 rounded-full bg-slate-200 border border-slate-300/60 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                        <img
                            v-if="authStore.user?.avatar"
                            :src="authStore.user?.avatar"
                            alt="User Avatar"
                            class="w-full h-full object-cover"
                        />
                        <span v-else class="material-icons-round text-2xl text-slate-400">
                            military_tech
                        </span>
                    </div>

                    <div class="min-w-0 flex-1">
                        <p class="text-xs font-semibold text-slate-700 truncate">{{ authStore.user?.username }}</p>
                        <p class="text-xs text-blue-600 truncate">{{ authStore.user?.rankName }}</p>
                    </div>
                </div>
            </div>
        </aside>

        <main class="flex-1 p-6 overflow-auto">
            <RouterView />
        </main>
    </div>

    <div v-else-if="!authStore.loading" class="min-h-screen bg-slate-100">
        <RouterView />
    </div>

    <div v-else class="flex min-h-screen items-center justify-center bg-slate-100 text-slate-400 text-sm">
        Loading...
    </div>
</template>