<script setup>
import { ref, onMounted, computed } from 'vue'
import { usePermissions } from '../composables/usePermissions'
import { useAuthStore } from '../stores/auth'

const { can } = usePermissions()
const authStore = useAuthStore()

const certs = ref([])
const memberCerts = ref([])
const members = ref([])
const loading = ref(true)
const showCreateModal = ref(false)
const showAwardModal = ref(false)
const editingCert = ref(null)

const form = ref({
    name: '',
    abbreviation: '',
    description: '',
    expiry_days: '',
    prerequisite_cert_id: ''
})

const awardForm = ref({
    robloxId: '',
    certId: ''
})

async function fetchCerts() {
    const res = await fetch('http://localhost:3000/api/certifications')
    certs.value = await res.json()
}

async function fetchMemberCerts() {
    if (can('VIEW_ALL_CERTS')) {
        const res = await fetch('http://localhost:3000/api/certifications/members/all')
        memberCerts.value = await res.json()
    } else {
        const res = await fetch(`http://localhost:3000/api/certifications/members/${authStore.user.robloxId}`)
        memberCerts.value = await res.json()
    }
}

async function fetchMembers() {
    if (!can('MANAGE_CERTIFICATIONS')) return
    const res = await fetch('http://localhost:3000/api/members')
    members.value = await res.json()
}

onMounted(async () => {
    await Promise.all([fetchCerts(), fetchMemberCerts(), fetchMembers()])
    loading.value = false
})

function openCreate() {
    editingCert.value = null
    form.value = { name: '', abbreviation: '', description: '', expiry_days: '', prerequisite_cert_id: '' }
    showCreateModal.value = true
}

function openEdit(cert) {
    editingCert.value = cert
    form.value = {
        name: cert.name,
        abbreviation: cert.abbreviation,
        description: cert.description ?? '',
        expiry_days: cert.expiry_days ?? '',
        prerequisite_cert_id: cert.prerequisite_cert_id ?? ''
    }
    showCreateModal.value = true
}

async function submitCert() {
    const body = {
        name: form.value.name,
        abbreviation: form.value.abbreviation,
        description: form.value.description || null,
        expiry_days: form.value.expiry_days ? parseInt(form.value.expiry_days) : null,
        prerequisite_cert_id: form.value.prerequisite_cert_id || null
    }

    const url = editingCert.value
        ? `http://localhost:3000/api/certifications/${editingCert.value.id}`
        : 'http://localhost:3000/api/certifications'

    const method = editingCert.value ? 'PUT' : 'POST'

    await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })

    showCreateModal.value = false
    await fetchCerts()
}

async function deleteCert(id) {
    if (!confirm('Delete this certification? This will also revoke it from all members.')) return
    await fetch(`http://localhost:3000/api/certifications/${id}`, { method: 'DELETE' })
    await fetchCerts()
}

async function awardCert() {
    const res = await fetch('http://localhost:3000/api/certifications/members/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            robloxId: awardForm.value.robloxId,
            certId: parseInt(awardForm.value.certId),
            awardedBy: authStore.user.username
        })
    })

    if (!res.ok) {
        const err = await res.json()
        alert(err.error)
        return
    }

    showAwardModal.value = false
    await fetchMemberCerts()
}

async function revokeCert(id) {
    if (!confirm('Revoke this certification?')) return
    await fetch(`http://localhost:3000/api/certifications/members/revoke/${id}`, { method: 'DELETE' })
    await fetchMemberCerts()
}

function getPrereqName(id) {
    const cert = certs.value.find(c => c.id === id)
    return cert ? cert.abbreviation : 'Unknown'
}

function isExpired(expiresAt) {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
}

function isExpiringSoon(expiresAt) {
    if (!expiresAt) return false
    const diff = new Date(expiresAt) - new Date()
    return diff > 0 && diff < 7 * 86400000
}

function formatDate(date) {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString()
}
</script>

<template>
    <div v-if="loading" class="flex items-center justify-center h-64 text-slate-400">
        <span class="material-icons-round animate-spin text-4xl">progress_activity</span>
    </div>

    <div v-else>
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
            <div>
                <h1 class="text-2xl font-bold text-slate-800">Certifications</h1>
                <p class="text-sm text-slate-400 mt-0.5">Track qualifications and endorsements</p>
            </div>
            <div class="flex gap-2" v-if="can('MANAGE_CERTIFICATIONS')">
                <button
                    @click="showAwardModal = true"
                    class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                >
                    <span class="material-icons-round text-[18px]">add_task</span>
                    Award Cert
                </button>
                <button
                    @click="openCreate"
                    class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-all shadow-sm"
                >
                    <span class="material-icons-round text-[18px]">add</span>
                    New Certification
                </button>
            </div>
        </div>

        <!-- Available Certifications -->
        <div class="mb-8">
            <h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Available Certifications</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                    v-for="cert in certs"
                    :key="cert.id"
                    class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
                >
                    <div class="flex items-start justify-between mb-3">
                        <div>
                            <span class="inline-block bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-lg mb-2">
                                {{ cert.abbreviation }}
                            </span>
                            <h3 class="font-semibold text-slate-800 text-sm">{{ cert.name }}</h3>
                        </div>
                        <div v-if="can('MANAGE_CERTIFICATIONS')" class="flex gap-1">
                            <button @click="openEdit(cert)" class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                <span class="material-icons-round text-[16px]">edit</span>
                            </button>
                            <button @click="deleteCert(cert.id)" class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                <span class="material-icons-round text-[16px]">delete</span>
                            </button>
                        </div>
                    </div>
                    <p v-if="cert.description" class="text-xs text-slate-500 mb-3">{{ cert.description }}</p>
                    <div class="flex flex-wrap gap-2">
                        <span v-if="cert.expiry_days" class="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                            <span class="material-icons-round text-[14px]">schedule</span>
                            Expires after {{ cert.expiry_days }} days
                        </span>
                        <span v-else class="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                            <span class="material-icons-round text-[14px]">all_inclusive</span>
                            No expiry
                        </span>
                        <span v-if="cert.prerequisite_cert_id" class="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                            <span class="material-icons-round text-[14px]">lock</span>
                            Requires {{ getPrereqName(cert.prerequisite_cert_id) }}
                        </span>
                    </div>
                </div>

                <div v-if="certs.length === 0" class="col-span-3 text-center text-slate-400 text-sm py-12">
                    No certifications defined yet.
                </div>
            </div>
        </div>

        <!-- Awarded Certifications -->
        <div>
            <h2 class="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                {{ can('VIEW_ALL_CERTS') ? 'All Awarded Certifications' : 'Your Certifications' }}
            </h2>
            <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="border-b border-slate-100">
                            <th v-if="can('VIEW_ALL_CERTS')" class="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Member</th>
                            <th class="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Certification</th>
                            <th class="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Awarded</th>
                            <th class="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Expires</th>
                            <th class="text-left px-5 py-3.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                            <th v-if="can('MANAGE_CERTIFICATIONS')" class="px-5 py-3.5"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="mc in memberCerts"
                            :key="mc.id"
                            class="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                        >
                            <td v-if="can('VIEW_ALL_CERTS')" class="px-5 py-3.5 font-medium text-slate-700">{{ mc.roblox_username ?? 'Unknown' }}</td>
                            <td class="px-5 py-3.5">
                                <span class="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-lg">{{ mc.abbreviation }}</span>
                            </td>
                            <td class="px-5 py-3.5 text-slate-500">{{ formatDate(mc.awarded_at) }}</td>
                            <td class="px-5 py-3.5 text-slate-500">{{ formatDate(mc.expires_at) }}</td>
                            <td class="px-5 py-3.5">
                                <span v-if="isExpired(mc.expires_at)" class="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-lg w-fit">
                                    <span class="material-icons-round text-[14px]">cancel</span> Expired
                                </span>
                                <span v-else-if="isExpiringSoon(mc.expires_at)" class="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg w-fit">
                                    <span class="material-icons-round text-[14px]">warning</span> Expiring Soon
                                </span>
                                <span v-else class="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg w-fit">
                                    <span class="material-icons-round text-[14px]">check_circle</span> Active
                                </span>
                            </td>
                            <td v-if="can('MANAGE_CERTIFICATIONS')" class="px-5 py-3.5">
                                <button @click="revokeCert(mc.id)" class="text-xs text-red-500 hover:text-red-700 font-medium">Revoke</button>
                            </td>
                        </tr>
                        <tr v-if="memberCerts.length === 0">
                            <td colspan="6" class="px-5 py-12 text-center text-slate-400">No certifications awarded yet.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Create/Edit Modal -->
        <div v-if="showCreateModal" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <h2 class="text-lg font-bold text-slate-800 mb-5">
                    {{ editingCert ? 'Edit Certification' : 'New Certification' }}
                </h2>
                <div class="flex flex-col gap-4">
                    <div>
                        <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Name</label>
                        <input v-model="form.name" type="text" placeholder="e.g. Basic Flying Qualification"
                            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                    </div>
                    <div>
                        <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Abbreviation</label>
                        <input v-model="form.abbreviation" type="text" placeholder="e.g. BFQ"
                            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                    </div>
                    <div>
                        <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Description</label>
                        <textarea v-model="form.description" rows="2" placeholder="Optional description"
                            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none" />
                    </div>
                    <div>
                        <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Expiry (days)</label>
                        <input v-model="form.expiry_days" type="number" placeholder="Leave blank for no expiry"
                            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                    </div>
                    <div>
                        <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Prerequisite</label>
                        <select v-model="form.prerequisite_cert_id"
                            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                            <option value="">None</option>
                            <option v-for="cert in certs" :key="cert.id" :value="cert.id">
                                {{ cert.abbreviation }} — {{ cert.name }}
                            </option>
                        </select>
                    </div>
                </div>
                <div class="flex gap-2 mt-6">
                    <button @click="showCreateModal = false"
                        class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
                        Cancel
                    </button>
                    <button @click="submitCert"
                        class="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all">
                        {{ editingCert ? 'Save Changes' : 'Create' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Award Modal -->
        <div v-if="showAwardModal" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <h2 class="text-lg font-bold text-slate-800 mb-5">Award Certification</h2>
                <div class="flex flex-col gap-4">
                    <div>
                        <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Member</label>
                        <select v-model="awardForm.robloxId"
                            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                            <option value="">-- Select Member --</option>
                            <option v-for="m in members" :key="m.roblox_id" :value="m.roblox_id">
                                {{ m.roblox_username }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Certification</label>
                        <select v-model="awardForm.certId"
                            class="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400">
                            <option value="">-- Select Certification --</option>
                            <option v-for="cert in certs" :key="cert.id" :value="cert.id">
                                {{ cert.abbreviation }} — {{ cert.name }}
                            </option>
                        </select>
                    </div>
                </div>
                <div class="flex gap-2 mt-6">
                    <button @click="showAwardModal = false"
                        class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
                        Cancel
                    </button>
                    <button @click="awardCert"
                        class="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all">
                        Award
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>