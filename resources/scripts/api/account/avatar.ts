import http from '@/api/http';

export const uploadAvatar = (file: File): Promise<void> => {
    const data = new FormData();
    data.append('avatar', file);

    return new Promise((resolve, reject) => {
        http.post('/api/client/account/avatar', data, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
            .then(() => resolve())
            .catch(reject);
    });
};

export const removeAvatar = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        http.delete('/api/client/account/avatar')
            .then(() => resolve())
            .catch(reject);
    });
};
