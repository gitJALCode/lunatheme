import React, { useEffect, useState } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { Link } from 'react-router-dom';
import getPlans, { StoreCatalog, StorePlan } from '@/api/store/getPlans';
import createCheckout from '@/api/store/createCheckout';
import { httpErrorToHuman } from '@/api/http';
import LunaLogo from '@/components/elements/LunaLogo';
import Spinner from '@/components/elements/Spinner';
import PlanCard from '@/components/store/PlanCard';

const CURRENCY_SYMBOLS: Record<string, string> = {
    eur: '€',
    usd: '$',
    gbp: '£',
};

const Page = styled.div`
    ${tw`min-h-screen w-full`};
`;

const Header = styled.div`
    ${tw`flex items-center justify-between max-w-6xl mx-auto px-6 py-6`};
`;

const Alert = styled.div`
    ${tw`max-w-6xl mx-auto px-6`};

    & > div {
        ${tw`rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-sm px-4 py-3`};
    }
`;

export default () => {
    const [catalog, setCatalog] = useState<StoreCatalog | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    useEffect(() => {
        document.title = 'Order a Server';

        getPlans()
            .then(setCatalog)
            .catch((err) => setError(httpErrorToHuman(err)));
    }, []);

    const onSubscribe = (plan: StorePlan) => {
        setError(null);

        if (!catalog?.authenticated) {
            window.location.href = `/auth/login?redirect=${encodeURIComponent('/order')}`;
            return;
        }

        setLoadingPlan(plan.slug);
        createCheckout(plan.slug)
            .then((url) => {
                window.location.href = url;
            })
            .catch((err) => {
                setLoadingPlan(null);
                setError(httpErrorToHuman(err));
            });
    };

    const currencySymbol = catalog ? CURRENCY_SYMBOLS[catalog.currency] ?? '' : '';

    return (
        <Page>
            <Header>
                <div css={tw`flex items-center gap-3`}>
                    <LunaLogo size={36} />
                    <span css={tw`text-lg font-semibold text-neutral-100`}>Order a Server</span>
                </div>
                <Link to={'/'} css={tw`text-sm text-primary-300 no-underline hover:text-primary-200`}>
                    {catalog?.authenticated ? 'My servers' : 'Sign in'}
                </Link>
            </Header>

            <div css={tw`max-w-6xl mx-auto px-6 pb-6 text-center`}>
                <h1 css={tw`text-3xl font-bold text-neutral-100`}>Pick your plan</h1>
                <p css={tw`text-neutral-400 mt-2`}>
                    Billed monthly. Your server is created automatically the moment your payment is confirmed.
                </p>
            </div>

            {error && (
                <Alert css={tw`mb-4`}>
                    <div>{error}</div>
                </Alert>
            )}

            {!catalog && !error && (
                <div css={tw`flex justify-center py-20`}>
                    <Spinner size={'large'} />
                </div>
            )}

            {catalog && (
                <div css={tw`max-w-6xl mx-auto px-6 pb-16 grid grid-cols-1 md:grid-cols-3 gap-6`}>
                    {catalog.plans.map((plan) => (
                        <PlanCard
                            key={plan.slug}
                            plan={plan}
                            currencySymbol={currencySymbol}
                            loading={loadingPlan === plan.slug}
                            onSubscribe={onSubscribe}
                        />
                    ))}
                </div>
            )}
        </Page>
    );
};
