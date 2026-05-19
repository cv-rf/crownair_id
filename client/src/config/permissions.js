export const TIERS = {
    OR: { min: 1, max: 102 },
    OFFICER_CADET: { min: 201, max: 229 },
    SENIOR_OFFICER: { min: 237, max: 239 },
    AIR_RANK: { min: 251, max: 255 }
}

export function getTier(rankId) {
    if (rankId >= 251) return 5
    if (rankId >= 237) return 4
    if (rankId >= 201) return 3
    if (rankId >= 101) return 2
    if (rankId >= 1)   return 1
    return 0
}

export const PERMISSIONS = {
    VIEW_OWN_PROFILE:      tier => tier >= 1,
    VIEW_OWN_CERTS:        tier => tier >= 1,
    SUBMIT_APPLICATIONS:   tier => tier >= 1,
    VIEW_OWN_REGIMENT:     tier => tier >= 1,

    VIEW_MEMBER_LIST:      tier => tier >= 2,
    VIEW_ALL_CERTS:        tier => tier >= 2,

    VIEW_REGIMENT_ROSTERS: tier => tier >= 3,
    REVIEW_APPLICATIONS:   tier => tier >= 3,

    MANAGE_CERTIFICATIONS: tier => tier >= 4,
    MANAGE_REGIMENT:       tier => tier >= 4,
    APPROVE_APPLICATIONS:  tier => tier >= 4,

    MANAGE_BINDS:          tier => tier >= 5,
    MANAGE_REGIMENTS:      tier => tier >= 5,
    MANAGE_RANK_REQS:      tier => tier >= 5,
    BOT_SETTINGS:          tier => tier >= 5,
}