<template>
    <div class="bg-white rounded-2xl p-6 shadow-sm flex items-center gap-4">
        <div class="bg-blue-50 rounded-xl p-3">
            <span class="material-icons-round text-blue-600 text-[24px]">{{ icon }}</span>
        </div>
        <div>
            <p class="text-sm text-slate-400 font-medium">{{ label }}</p>
            <p class="text-2xl font-bold text-slate-800">{{ value }}</p>
        </div>
    </div>
</template>

<script setup>
defineProps(['icon', 'label', 'value'])
</script>