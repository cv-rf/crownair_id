<template>
    <RouterLink
        :to="to"
        class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all"
        active-class="bg-blue-50 text-blue-600 hover:bg-blue-50 hover:text-blue-600"
    >
        <span class="material-icons-round text-[20px]">{{ icon }}</span>
        {{ label }}
    </RouterLink>
</template>

<script setup>
defineProps(['to', 'icon', 'label'])
</script>