<template>
    <div class="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <!-- Login Card Container -->
        <div class="w-full max-w-md bg-white rounded-2xl p-8 shadow-sm border border-slate-200/60 text-center">
            
            <!-- ARAF Branding Section -->
            <div class="mb-8">
                <!-- Large Round Emblem Placeholder -->
                <div class="w-20 h-20 bg-slate-50 border-2 border-blue-600/20 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <span class="material-icons-round text-4xl">flight_takeoff</span>
                </div>
                <h1 class="text-2xl font-bold text-slate-800 tracking-tight">ARAF ID Network</h1>
                <p class="text-sm text-slate-400 mt-1">Personnel Authorization & Management</p>
            </div>

            <!-- Notice / Information Callout -->
            <div class="bg-blue-50/60 border border-blue-100 rounded-xl p-4 text-left mb-6">
                <div class="flex gap-2.5 items-start">
                    <span class="material-icons-round text-blue-600 text-xl mt-0.5">security</span>
                    <div>
                        <h4 class="text-xs font-bold text-blue-800 uppercase tracking-wider">Secure Verification</h4>
                        <p class="text-xs text-blue-700/90 mt-0.5 leading-relaxed">
                            This application utilizes official Roblox OAuth 2.0. We will securely verify your account identity, group rank permissions, and squadron data.
                        </p>
                    </div>
                </div>
            </div>

            <!-- Action Button -->
            <div class="space-y-3">
                <a 
                    href="http://localhost:3000/auth/roblox/login" 
                    class="flex items-center justify-center gap-3 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-xl transition duration-150 shadow-sm shadow-blue-600/10 group"
                >
                    <!-- Custom simulated Roblox icon or material alternative -->
                    <span class="material-icons-round text-xl group-hover:scale-110 transition duration-150">login</span>
                    <span>Sign in with Roblox</span>
                </a>
                
                <p class="text-[11px] text-slate-400 font-medium">
                    By authenticating, you sync your group roleset automatically.
                </p>
            </div>

            <!-- Footer Meta -->
            <div class="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400">
                <span>Property of ARAF</span>
                <span>&copy; atticl's Royal Air Force 2026</span>
            </div>
        </div>
    </div>
</template>

<script setup>
// Pure presentation component, the anchor tag handles the external redirect to Express
</script>