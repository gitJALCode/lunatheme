import http from '@/api/http';

export interface StorePlan {
    slug: string;
    name: string;
    price: string;
    memory: number;
    disk: number;
    cpu: number;
    databases: number;
    backups: number;
    inStock: boolean;
}

export interface StoreCatalog {
    currency: string;
    authenticated: boolean;
    plans: StorePlan[];
}

export default (): Promise<StoreCatalog> => {
    return new Promise((resolve, reject) => {
        http.get('/api/store/plans')
            .then(({ data }) =>
                resolve({
                    currency: data.currency,
                    authenticated: data.authenticated,
                    plans: (data.plans || []).map((plan: any) => ({
                        slug: plan.slug,
                        name: plan.name,
                        price: plan.price,
                        memory: plan.memory,
                        disk: plan.disk,
                        cpu: plan.cpu,
                        databases: plan.databases,
                        backups: plan.backups,
                        inStock: plan.in_stock,
                    })),
                })
            )
            .catch(reject);
    });
};
