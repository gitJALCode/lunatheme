import React from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMemory, faHdd, faMicrochip, faDatabase, faArchive, faCheck } from '@fortawesome/free-solid-svg-icons';
import { StorePlan } from '@/api/store/getPlans';

const Card = styled.div<{ $disabled?: boolean }>`
    ${tw`relative flex flex-col bg-neutral-700 border border-neutral-600 rounded-xl p-6 overflow-hidden transition-all duration-150`};

    ${(props) => !props.$disabled && tw`hover:border-primary-600`};

    &::after {
        content: '';
        ${tw`absolute top-0 right-0 h-full w-1/3 pointer-events-none`};
        background: radial-gradient(circle at 100% 0%, rgba(79, 70, 229, 0.18), transparent 70%);
    }

    ${(props) => props.$disabled && tw`opacity-60`};
`;

const SubscribeButton = styled.button`
    ${tw`w-full mt-6 py-3 rounded-xl text-sm font-semibold text-white border-none cursor-pointer transition-opacity duration-150`};
    background-image: linear-gradient(135deg, #5b63f5, #4f46e5);

    &:hover {
        ${tw`opacity-90`};
    }

    &:disabled {
        ${tw`opacity-50 cursor-not-allowed`};
    }
`;

const OutOfStockButton = styled.div`
    ${tw`w-full mt-6 py-3 rounded-xl text-sm font-semibold text-center text-neutral-400 bg-neutral-600 border border-neutral-500`};
`;

const Feature = ({ icon, children }: { icon: typeof faMemory; children: React.ReactNode }) => (
    <li css={tw`flex items-center gap-3 text-sm text-neutral-200 py-1.5`}>
        <FontAwesomeIcon icon={icon} css={tw`w-3.5 h-3.5 text-primary-400`} />
        <span>{children}</span>
    </li>
);

const formatGb = (mib: number) => `${Math.round((mib / 1024) * 10) / 10} GB`;

interface Props {
    plan: StorePlan;
    currencySymbol: string;
    loading: boolean;
    onSubscribe: (plan: StorePlan) => void;
}

export default ({ plan, currencySymbol, loading, onSubscribe }: Props) => (
    <Card $disabled={!plan.inStock}>
        {!plan.inStock && (
            <span css={tw`absolute top-4 right-4 z-10 text-2xs font-semibold uppercase tracking-wide px-2 py-1 rounded-full bg-red-500/20 text-red-300`}>
                Out of stock
            </span>
        )}

        <h3 css={tw`text-lg font-semibold text-neutral-100`}>{plan.name}</h3>
        <p css={tw`text-sm text-neutral-400 mt-1`}>{formatGb(plan.memory)} dedicated RAM</p>

        <div css={tw`flex items-baseline gap-1 mt-4`}>
            <span css={tw`text-3xl font-bold text-neutral-100`}>
                {currencySymbol}
                {plan.price}
            </span>
            <span css={tw`text-sm text-neutral-400`}>/ month</span>
        </div>

        <ul css={tw`mt-6 mb-2 list-none p-0`}>
            <Feature icon={faMemory}>{formatGb(plan.memory)} RAM</Feature>
            <Feature icon={faHdd}>{formatGb(plan.disk)} SSD storage</Feature>
            <Feature icon={faMicrochip}>{plan.cpu}% CPU</Feature>
            <Feature icon={faDatabase}>
                {plan.databases} {plan.databases === 1 ? 'database' : 'databases'}
            </Feature>
            <Feature icon={faArchive}>
                {plan.backups} {plan.backups === 1 ? 'backup' : 'backups'}
            </Feature>
            <Feature icon={faCheck}>Instant automatic setup</Feature>
        </ul>

        <div css={tw`mt-auto`}>
            {plan.inStock ? (
                <SubscribeButton disabled={loading} onClick={() => onSubscribe(plan)}>
                    {loading ? 'Processing…' : 'Subscribe'}
                </SubscribeButton>
            ) : (
                <OutOfStockButton>Unavailable</OutOfStockButton>
            )}
        </div>
    </Card>
);
