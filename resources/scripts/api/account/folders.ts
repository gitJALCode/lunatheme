import http from '@/api/http';

export interface ServerFolder {
    id: number;
    name: string;
    color: string;
    servers: string[];
}

const rawToFolder = (data: any): ServerFolder => ({
    id: data.attributes.id,
    name: data.attributes.name,
    color: data.attributes.color || '#4f46e5',
    servers: data.attributes.servers || [],
});

export const getFolders = (): Promise<ServerFolder[]> => {
    return new Promise((resolve, reject) => {
        http.get('/api/client/folders')
            .then(({ data }) => resolve((data.data || []).map(rawToFolder)))
            .catch(reject);
    });
};

export const createFolder = (name: string, color: string): Promise<ServerFolder> => {
    return new Promise((resolve, reject) => {
        http.post('/api/client/folders', { name, color })
            .then(({ data }) => resolve(rawToFolder(data)))
            .catch(reject);
    });
};

export const updateFolder = (id: number, values: { name?: string; color?: string }): Promise<ServerFolder> => {
    return new Promise((resolve, reject) => {
        http.patch(`/api/client/folders/${id}`, values)
            .then(({ data }) => resolve(rawToFolder(data)))
            .catch(reject);
    });
};

export const deleteFolder = (id: number): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.delete(`/api/client/folders/${id}`)
            .then(() => resolve())
            .catch(reject);
    });
};

export const setFolderServers = (id: number, servers: string[]): Promise<ServerFolder> => {
    return new Promise((resolve, reject) => {
        http.put(`/api/client/folders/${id}/servers`, { servers })
            .then(({ data }) => resolve(rawToFolder(data)))
            .catch(reject);
    });
};
