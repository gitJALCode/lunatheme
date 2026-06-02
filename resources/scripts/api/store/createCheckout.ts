import http from '@/api/http';

export default (plan: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        http.post('/api/store/checkout', { plan })
            .then(({ data }) => resolve(data.url))
            .catch(reject);
    });
};
