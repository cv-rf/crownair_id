/**
 * Fetches all groups and ranks a Roblox user belongs to in a single API call
 * @param {string|number} robloxId
 * @returns {Promise<Map<number, number>>} A Map of GroupID -> Rank Number
 */
export async function fetchUserGroupRanks(robloxId) {
    const userGroupsMap = new Map();

    try {
        const response = await fetch(`https://groups.roblox.com/v2/users/${robloxId}/groups/roles`);
        if (!response.ok) {
            throw new Error(`Roblox API returned status code ${response.status}`);
        }

        const json = await response.json();

        if (json.data && Array.isArray(json.data)) {
            for (const item of json.data) {
                userGroupsMap.set(item.group.id, item.role.rank);
            }
        }
    } catch (error) {
        console.error(`Error fetching Roblox group data for user ${robloxId}`, error.message);
    }

    return userGroupsMap;
}

/**
 * Fetches names and ranks of all roles inside a target group profile
 * @param {string|number} groupId 
 * @returns {Promise<{name: string, roles: Array}>} Group name and rank definitions
 */
export async function fetchGroupRoleset(groupId) {
    try {
        const groupRes = await fetch(`https://groups.roblox.com/v1/groups/${groupId}`);
        const rolesRes = await fetch(`https://groups.roblox.com/v1/groups/${groupId}/roles`);

        if (!groupRes.ok || !rolesRes.ok) throw new Error('Could not pull group asset metadata from Roblox API');

        const groupJson = await groupRes.json();
        const rolesJson = await rolesRes.json();

        return {
            name: groupJson.name,
            roles: rolesJson.roles.map(r => ({ rank: r.rank, name: r.name }))
        };
    } catch (err) {
        console.error(`[Roblox API] Failed pulling configuration for ${groupId}:`, err.message);
        return null;
    }
}