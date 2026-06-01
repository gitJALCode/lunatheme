import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEthernet, faHdd, faMemory, faMicrochip } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import tw from 'twin.macro';
import styled from 'styled-components/macro';

const isAlarmState = (current: number, limit: number): boolean => limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

const Card = styled(Link)`
    ${tw`block bg-neutral-700 border border-neutral-600 rounded-xl p-5 no-underline transition-all duration-150 relative overflow-hidden`};

    &:hover {
        ${tw`border-primary-600`};
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    }

    /* faint decorative glow on the right */
    &::after {
        content: '';
        ${tw`absolute top-0 right-0 h-full w-1/3 pointer-events-none`};
        background: radial-gradient(circle at 100% 50%, rgba(79, 70, 229, 0.18), transparent 70%);
    }
`;

const Stat = ({
    icon,
    value,
    limit,
    alarm,
}: {
    icon: typeof faMicrochip;
    value: string;
    limit: string;
    alarm?: boolean;
}) => (
    <div css={tw`flex items-center gap-2`}>
        <FontAwesomeIcon icon={icon} css={[tw`w-3.5 h-3.5`, alarm ? tw`text-red-400` : tw`text-neutral-500`]} />
        <span css={[tw`text-sm font-medium`, alarm ? tw`text-red-300` : tw`text-neutral-200`]}>{value}</span>
        <span css={tw`text-xs text-neutral-500`}>/ {limit}</span>
    </div>
);

type Timer = ReturnType<typeof setInterval>;

export default ({ server, className }: { server: Server; className?: string }) => {
    const interval = useRef<Timer>(null) as React.MutableRefObject<Timer>;
    const [isSuspended, setIsSuspended] = useState(server.status === 'suspended');
    const [stats, setStats] = useState<ServerStats | null>(null);

    const getStats = () =>
        getServerResourceUsage(server.uuid)
            .then((data) => setStats(data))
            .catch((error) => console.error(error));

    useEffect(() => {
        setIsSuspended(stats?.isSuspended || server.status === 'suspended');
    }, [stats?.isSuspended, server.status]);

    useEffect(() => {
        if (isSuspended) return;

        getStats().then(() => {
            interval.current = setInterval(() => getStats(), 30000);
        });

        return () => {
            interval.current && clearInterval(interval.current);
        };
    }, [isSuspended]);

    const alarms = { cpu: false, memory: false, disk: false };
    if (stats) {
        alarms.cpu = server.limits.cpu === 0 ? false : stats.cpuUsagePercent >= server.limits.cpu * 0.9;
        alarms.memory = isAlarmState(stats.memoryUsageInBytes, server.limits.memory);
        alarms.disk = server.limits.disk === 0 ? false : isAlarmState(stats.diskUsageInBytes, server.limits.disk);
    }

    const diskLimit = server.limits.disk !== 0 ? bytesToString(mbToBytes(server.limits.disk)) : 'Unlimited';
    const memoryLimit = server.limits.memory !== 0 ? bytesToString(mbToBytes(server.limits.memory)) : 'Unlimited';
    const cpuLimit = server.limits.cpu !== 0 ? server.limits.cpu + '%' : 'Unlimited';

    const allocation = server.allocations.find((a) => a.isDefault) || server.allocations[0];
    const isOnline = stats?.status === 'running';
    const statusColor = isSuspended
        ? tw`bg-red-500`
        : isOnline
        ? tw`bg-green-500`
        : !stats || stats.status === 'offline'
        ? tw`bg-red-500`
        : tw`bg-yellow-500`;
    const statusLabel = isSuspended
        ? 'Suspended'
        : !stats
        ? 'Loading'
        : stats.status === 'running'
        ? 'Online'
        : stats.status === 'offline' || !stats.status
        ? 'Offline'
        : stats.status.charAt(0).toUpperCase() + stats.status.slice(1);

    return (
        <Card to={`/server/${server.id}`} className={className}>
            <div css={tw`flex items-start justify-between relative z-10`}>
                <div css={tw`min-w-0`}>
                    <p css={tw`text-base font-semibold text-neutral-100 truncate`}>{server.name}</p>
                    {!!server.description && (
                        <p css={tw`text-sm text-neutral-400 truncate mt-0.5`}>{server.description}</p>
                    )}
                </div>
                <div css={tw`flex items-center gap-2 flex-shrink-0 ml-4`}>
                    <span css={[tw`w-2 h-2 rounded-full`, statusColor]} />
                    <span css={tw`text-xs font-medium text-neutral-300`}>{statusLabel}</span>
                </div>
            </div>
            <div css={tw`flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 relative z-10`}>
                <Stat
                    icon={faMicrochip}
                    value={stats ? `${stats.cpuUsagePercent.toFixed(1)}%` : '0.0%'}
                    limit={cpuLimit}
                    alarm={alarms.cpu}
                />
                <Stat
                    icon={faMemory}
                    value={stats ? bytesToString(stats.memoryUsageInBytes) : '0 Bytes'}
                    limit={memoryLimit}
                    alarm={alarms.memory}
                />
                <Stat
                    icon={faHdd}
                    value={stats ? bytesToString(stats.diskUsageInBytes) : '0 Bytes'}
                    limit={diskLimit}
                    alarm={alarms.disk}
                />
                {allocation && (
                    <div css={tw`flex items-center gap-2`}>
                        <FontAwesomeIcon icon={faEthernet} css={tw`w-3.5 h-3.5 text-neutral-500`} />
                        <span css={tw`text-sm font-medium text-neutral-200`}>
                            {allocation.alias || ip(allocation.ip)}:{allocation.port}
                        </span>
                    </div>
                )}
            </div>
        </Card>
    );
};
