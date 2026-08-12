import { ProjectSchema } from '@spatial/core';
export async function fetchSharedProject(token) {
    const response = await fetch(`http://localhost:4000/api/projects/share/${encodeURIComponent(token)}`);
    if (!response.ok) {
        throw new Error('Unable to load the published design.');
    }
    const payload = (await response.json());
    const parsedProject = payload.project ?? payload;
    return ProjectSchema.parse(parsedProject);
}
//# sourceMappingURL=api-client.js.map