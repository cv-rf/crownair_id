<script setup>
defineProps({
    regiment: {
        type: Object,
        required: true
    },
    canManage: {
        type: Boolean,
        default: false
    }
})

defineEmits(['view-applications', 'view-roster', 'edit', 'delete'])
</script>

<template>
    <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100/60 transition-all duration-200 flex flex-col justify-between group relative">
        <div>
            <!-- Top Header: Icon & Admin Management Controls -->
            <div class="flex items-center justify-between mb-4">
                <!-- Icon Container -->
                <div class="w-11 h-11 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-all duration-200 shadow-inner">
                    <span class="material-icons-round text-xl">
                        {{ regiment.icon }}
                    </span>
                </div>

                <!-- Admin Actions (Only visible if RankID > 254) -->
                <div v-if="canManage" class="flex items-center gap-0.5 bg-slate-50 p-1 rounded-xl border border-slate-100">
                    <button 
                        @click="$emit('edit', regiment)"
                        class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                        title="Edit Regiment"
                    >
                        <span class="material-icons-round text-base">edit</span>
                    </button>
                    <button 
                        @click="$emit('delete', regiment)"
                        class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all"
                        title="Delete Regiment"
                    >
                        <span class="material-icons-round text-base">delete</span>
                    </button>
                </div>
            </div>

            <!-- Regiment Core Info -->
            <div class="min-w-0">
                <h3 class="font-bold text-slate-800 text-base truncate tracking-tight group-hover:text-blue-600 transition-colors">
                    {{ regiment.name }}
                </h3>
                <p class="text-xs font-semibold text-blue-600 truncate mt-0.5 tracking-wide">
                    {{ regiment.specialization }}
                </p>
            </div>

            <!-- Structured Data Table -->
            <div class="mt-4 pt-4 border-t border-slate-100/80 flex flex-col gap-2">
                <div class="flex justify-between items-center text-xs">
                    <span class="text-slate-400">Commanding Officer</span>
                    <span class="font-semibold text-slate-700 truncate max-w-40">{{ regiment.commander }}</span>
                </div>
                <div class="flex justify-between items-center text-xs">
                    <span class="text-slate-400">Active Personnel</span>
                    <span class="font-mono font-bold text-slate-500">{{ regiment.memberCount }} Members</span>
                </div>
            </div>
        </div>

        <!-- Card Actions -->
        <div class="mt-6 flex gap-2.5">
            <button 
                @click="$emit('view-applications', regiment)"
                class="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100/80 border border-slate-100 py-2.5 rounded-xl transition-all"
            >
                <span class="material-icons-round text-base text-slate-400">assignment</span>
                <span>Applications</span>
            </button>
            
            <button 
                @click="$emit('view-roster', regiment)"
                class="flex-1 inline-flex items-center justify-center gap-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 py-2.5 rounded-xl transition-all shadow-sm shadow-blue-500/10"
            >
                <span>View Roster</span>
                <span class="material-icons-round text-sm">chevron_right</span>
            </button>
        </div>
    </div>
</template>