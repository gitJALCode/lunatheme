import React, { memo } from 'react';
import { ServerContext } from '@/state/server';
import Can from '@/components/elements/Can';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import isEqual from 'react-fast-compare';
import Spinner from '@/components/elements/Spinner';
import Features from '@feature/Features';
import Console from '@/components/server/console/Console';
import StatGraphs from '@/components/server/console/StatGraphs';
import PowerButtons from '@/components/server/console/PowerButtons';
import ServerDetailsBlock from '@/components/server/console/ServerDetailsBlock';
import { Alert } from '@/components/elements/alert';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullhorn } from '@fortawesome/free-solid-svg-icons';

export type PowerAction = 'start' | 'stop' | 'restart' | 'kill';

const ServerConsoleContainer = () => {
    const name = ServerContext.useStoreState((state) => state.server.data!.name);
    const isInstalling = ServerContext.useStoreState((state) => state.server.isInstalling);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data!.isTransferring);
    const eggFeatures = ServerContext.useStoreState((state) => state.server.data!.eggFeatures, isEqual);
    const isNodeUnderMaintenance = ServerContext.useStoreState((state) => state.server.data!.isNodeUnderMaintenance);
    const status = ServerContext.useStoreState((state) => state.status.value);

    const statusColor =
        !status || status === 'offline' ? 'bg-red-500' : status === 'running' ? 'bg-green-500' : 'bg-yellow-500';
    const statusLabel = !status ? 'Offline' : status.charAt(0).toUpperCase() + status.slice(1);

    return (
        <ServerContentBlock title={'Console'}>
            {(isNodeUnderMaintenance || isInstalling || isTransferring) && (
                <Alert type={'warning'} className={'mb-4'}>
                    {isNodeUnderMaintenance
                        ? 'The node of this server is currently under maintenance and all actions are unavailable.'
                        : isInstalling
                        ? 'This server is currently running its installation process and most actions are unavailable.'
                        : 'This server is currently being transferred to another node and all actions are unavailable.'}
                </Alert>
            )}

            {/* Welcome banner */}
            <div
                className={
                    'flex items-center gap-4 mb-4 rounded-xl bg-neutral-700 border border-neutral-600 border-l-4 border-l-green-500 px-5 py-4'
                }
            >
                <div className={'h-9 w-9 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center'}>
                    <FontAwesomeIcon icon={faBullhorn} />
                </div>
                <div>
                    <p className={'font-semibold text-neutral-100'}>Welcome to your new server!</p>
                    <p className={'text-sm text-neutral-400'}>
                        Here you can manage files, backups, sub-users, activity logs and more!
                    </p>
                </div>
            </div>

            {/* Name + power controls */}
            <div className={'flex items-center justify-between gap-4 mb-4 rounded-xl bg-neutral-700 border border-neutral-600 px-5 py-3'}>
                <p className={'font-semibold text-neutral-100 truncate'}>{name}</p>
                <Can action={['control.start', 'control.stop', 'control.restart']} matchAny>
                    <PowerButtons className={'flex space-x-2'} />
                </Can>
            </div>

            {/* Server banner */}
            <div
                className={'relative mb-4 rounded-xl overflow-hidden h-40 sm:h-48 bg-cover bg-center'}
                style={{ backgroundImage: "url('/assets/luna/server-banner.svg')" }}
            >
                <div className={'absolute inset-0 bg-gradient-to-r from-black/60 to-transparent'} />
                <div className={'absolute bottom-0 left-0 p-6'}>
                    <h1 className={'font-header font-bold text-3xl text-white drop-shadow'}>{name}</h1>
                    <div className={'flex items-center mt-1'}>
                        <span className={`w-2 h-2 rounded-full mr-2 ${statusColor}`} />
                        <span className={'text-sm text-gray-200'}>{statusLabel}</span>
                    </div>
                </div>
            </div>

            {/* Stat cards */}
            <ServerDetailsBlock className={'mb-4 !grid-cols-2 md:!grid-cols-4'} />

            {/* Console */}
            <div className={'flex mb-4'}>
                <Spinner.Suspense>
                    <Console />
                </Spinner.Suspense>
            </div>

            {/* Graphs */}
            <div className={'grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4'}>
                <Spinner.Suspense>
                    <StatGraphs />
                </Spinner.Suspense>
            </div>

            <Features enabled={eggFeatures} />
        </ServerContentBlock>
    );
};

export default memo(ServerConsoleContainer, isEqual);
