import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { getTier, PERMISSIONS } from '../config/permissions'

export function usePermissions() {
    const authStore = useAuthStore();

    const tier = computed(() => getTier(authStore.user?.rankId ?? 0))

    const can = (permission) => {
        const check = PERMISSIONS[permission]
        if (!check) return false
        return check(tier.value)
    }

    return { tier, can }
}