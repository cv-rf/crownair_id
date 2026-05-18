document.addEventListener('DOMContentLoaded', () => {
    let currentGroupRoles = [];

    // Elements
    const selectServer = document.getElementById('select-server');
    const selectDiscordRole = document.getElementById('select-discord-role');
    const selectRobloxRank = document.getElementById('select-roblox-rank');
    const btnLinkGroup = document.getElementById('btn-link-group');
    const bindForm = document.getElementById('bind-form');
    const bindsList = document.getElementById('binds-list');

    async function initDashboard() {
        // Fetch active servers the bot is residing inside
        const res = await fetch('/api/servers');
        const servers = await res.json();
        servers.forEach(s => {
            selectServer.innerHTML += `<option value="${s.id}">${s.name}</option>`;
        });
        loadBindingsTable();
    }

    // Trigger role load when server changes
    selectServer.addEventListener('change', async () => {
        const guildId = selectServer.value;
        if (!guildId) return;

        const res = await fetch(`/api/servers/${guildId}/roles`);
        const roles = await res.json();
        selectDiscordRole.innerHTML = '<option value="">-- Select Discord Role --</option>';
        roles.forEach(r => {
            selectDiscordRole.innerHTML += `<option value="${r.id}">@${r.name}</option>`;
        });
        selectDiscordRole.disabled = false;
    });

    // Handle initial Roblox group caching connections
    btnLinkGroup.addEventListener('click', async () => {
        const groupId = document.getElementById('target-group-id').value;
        if (!groupId) return alert('Provide a valid group identifier.');

        const res = await fetch('/api/groups/link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ groupId })
        });

        if (!res.ok) return alert('Failed syncing target configuration data profiles.');
        const data = await res.json();
        
        currentGroupRoles = data.roles;
        selectRobloxRank.innerHTML = '<option value="">-- Select Roblox Rank Name --</option>';
        data.roles.forEach(r => {
            selectRobloxRank.innerHTML += `<option value="${r.rank}" data-name="${r.name}">[Rank ${r.rank}] ${r.name}</option>`;
        });
        selectRobloxRank.disabled = false;
        alert(`Successfully mapped asset profiles for group: ${data.name}`);
    });

    // Handle compilation mappings submit
    bindForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const groupId = document.getElementById('target-group-id').value;
        const rankSelect = selectRobloxRank.options[selectRobloxRank.selectedIndex];
        const discordRoleId = selectDiscordRole.value;
        const isCumulative = document.getElementById('check-cumulative').checked;

        const response = await fetch('/api/binds', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                groupId,
                rank: parseInt(rankSelect.value, 10),
                roleName: rankSelect.getAttribute('data-name'),
                discordRoleId,
                cumulative: isCumulative
            })
        });

        if (response.ok) {
            bindForm.reset();
            loadBindingsTable();
        }
    });

    async function loadBindingsTable() {
        const res = await fetch('/api/binds');
        const binds = await res.json();
        bindsList.innerHTML = '';
        
        if(binds.length === 0) {
            bindsList.innerHTML = '<tr><td colspan="4" style="text-align:center;">No active links saved yet.</td></tr>';
            return;
        }

        binds.forEach(b => {
            bindsList.innerHTML += `
                <tr>
                    <td><code>ID: ${b.group_id}</code></td>
                    <td><strong>${b.roblox_role_name}</strong> (Rank ${b.roblox_rank})</td>
                    <td><span style="color:var(--accent)"><@&${b.discord_role_id}></span></td>
                    <td><button class="btn btn-danger" onclick="deleteBind('${b.group_id}', ${b.roblox_rank})">Delete</button></td>
                </tr>
            `;
        });
    }

    window.deleteBind = async (groupId, rank) => {
        await fetch(`/api/binds?groupId=${groupId}&rank=${rank}`, { method: 'DELETE' });
        loadBindingsTable();
    };

    initDashboard();
});