import { usersQueries } from "./queries/users.js";
import { certificationsQueries } from "./queries/certifications.js";

export const dbQueries = {
    ...usersQueries,
    ...certificationsQueries,
};