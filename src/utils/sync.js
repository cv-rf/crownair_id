import { fetchUserGroupRanks } from './roblox.js';
import { dbQueries } from '../database/db.js';

/**
 * Dynamically syncs a member's roles based on live database bindings across multiple groups
 * @param {GuildMember} member - The Discord target member object
 * @param {object} dbRecord - The database record representing the user
 * @returns {Promise<object>} Status report including arrays of added and removes roles IDs
 */
export async function syncUserRolesAndName(member, dbRecord) {
    if (!dbRecord) return { success: false, error: 'No database record provided' };

    try {
        if (member.nickname !== dbRecord.roblox_username) {
            await member.setNickname(dbRecord.roblox_username).catch(err => {
                console.warn(`[Sync] Lacked nickname permissions for ${member.username}: ${err.message}`);
            });
        }

        const activeBinds = dbQueries.getAllBinds();
        if (activeBinds.length === 0) {
            return { success: true, message: 'No group binds configured in database.' };
        }

        const userRankMap = await fetchUserGroupRanks(dbRecord.roblox_id);

        const rolesToGive = [];
        const rolesToRemove = [];

        for (const bind of activeBinds) {
            const configuredGroupId = parseInt(bind.group_id, 10);
            const userRankInGroup = userRankMap.get(configuredGroupId) || 0;

            const isCumulative = bind.cumulative === 1;
            const qualifies = isCumulative
                ? (userRankInGroup >= bind.roblox_rank && userRankInGroup > 0)
                : (userRankInGroup === bind.roblox_rank);

            if (qualifies) {
                rolesToGive.push(bind.discord_role_id);
            } else {
                rolesToRemove.push(bind.discord_role_id);
            }
        }

        const currentRoleIds = member.roles.cache.map(r => r.id);

        const rolesToAddFinal = rolesToGive.filter(id => !currentRoleIds.includes(id));
        const rolesToRemoveFinal = rolesToRemove.filter(id => currentRoleIds.includes(id) && !rolesToGive.includes(id));

        if (rolesToAddFinal.length > 0) await member.roles.add(rolesToAddFinal);
        if (rolesToRemoveFinal.length > 0) await member.roles.remove(rolesToRemoveFinal);

        console.log(`[Sync] Modular sync processed for ${dbRecord.roblox_username}`);
        return { 
            success: true,
            added: rolesToAddFinal,
            removed: rolesToRemoveFinal
        };
    } catch (error) {
        console.error(`[Sync] Failed dynamic binding sync for ${member.id}:`, error);
        return { success: false, error: error.message, added: [], removed: [] };
    }
}