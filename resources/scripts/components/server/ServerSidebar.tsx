import React from 'react';
import tw from 'twin.macro';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
    faTerminal,
    faFolder,
    faDatabase,
    faCalendarAlt,
    faUsers,
    faArchive,
    faNetworkWired,
    faRocket,
    faCog,
    faHistory,
    faExternalLinkAlt,
    faCopy,
} from '@fortawesome/free-solid-svg-icons';
import Sidebar, { SidebarLink, SidebarSection, SidebarExternalLink } from '@/components/elements/sidebar/Sidebar';
import Can from '@/components/elements/Can';
import { ServerContext } from '@/state/server';
import { useStoreState } from '@/state/hooks';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ip } from '@/lib/formatters';

interface NavMeta {
    icon: IconDefinition;
    group: 'overview' | 'configuration' | 'management';
}

// Maps the panel's server route names into the Luna grouped navigation.
const meta: Record<string, NavMeta> = {
    Console: { icon: faTerminal, group: 'overview' },
    Files: { icon: faFolder, group: 'management' },
    Databases: { icon: faDatabase, group: 'management' },
    Schedules: { icon: faCalendarAlt, group: 'configuration' },
    Users: { icon: faUsers, group: 'management' },
    Backups: { icon: faArchive, group: 'management' },
    Network: { icon: faNetworkWired, group: 'configuration' },
    Startup: { icon: faRocket, group: 'configuration' },
    Settings: { icon: faCog, group: 'configuration' },
    Activity: { icon: faHistory, group: 'configuration' },
};

interface Props {
    collapsed: boolean;
    onToggleCollapse: () => void;
    routes: { path: string; name: string | undefined; permission: string | string[] | null; exact?: boolean }[];
    to: (value: string, url?: boolean) => string;
}

const ServerSidebar = ({ collapsed, onToggleCollapse, routes, to }: Props) => {
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const name = ServerContext.useStoreState((state) => state.server.data?.name);
    const internalId = ServerContext.useStoreState((state) => state.server.data?.internalId);
    const allocations = ServerContext.useStoreState((state) => state.server.data?.allocations || []);
    const status = ServerContext.useStoreState((state) => state.status.value);

    const defaultAllocation = allocations.find((a) => a.isDefault) || allocations[0];
    const address = defaultAllocation
        ? `${defaultAllocation.alias || ip(defaultAllocation.ip)}:${defaultAllocation.port}`
        : null;

    const statusColor =
        !status || status === 'offline'
            ? tw`bg-red-500`
            : status === 'running'
            ? tw`bg-green-500`
            : tw`bg-yellow-500`;
    const statusLabel = !status ? 'Offline' : status.charAt(0).toUpperCase() + status.slice(1);

    const navItems = routes.filter((r) => !!r.name);
    const renderGroup = (group: NavMeta['group']) =>
        navItems
            .filter((r) => meta[r.name as string]?.group === group)
            .map((route) => {
                const link = (
                    <SidebarLink
                        key={route.path}
                        to={to(route.path, true)}
                        exact={route.exact}
                        icon={meta[route.name as string]?.icon || faTerminal}
                        label={route.name as string}
                        collapsed={collapsed}
                    />
                );
                return route.permission ? (
                    <Can key={route.path} action={route.permission} matchAny>
                        {link}
                    </Can>
                ) : (
                    link
                );
            });

    const header = (
        <div>
            <p css={tw`text-base font-semibold text-neutral-100 truncate`}>{name}</p>
            <div css={tw`flex items-center mt-1`}>
                <span css={[tw`w-2 h-2 rounded-full mr-2`, statusColor]} />
                <span css={tw`text-xs text-neutral-400`}>{statusLabel}</span>
            </div>
            {address && (
                <CopyOnClick text={address}>
                    <div css={tw`flex items-center mt-2 text-xs text-neutral-400 cursor-pointer hover:text-neutral-200`}>
                        <span css={tw`truncate`}>{address}</span>
                        <FontAwesomeIcon icon={faCopy} css={tw`ml-2 w-3 h-3`} />
                    </div>
                </CopyOnClick>
            )}
        </div>
    );

    return (
        <Sidebar collapsed={collapsed} onToggleCollapse={onToggleCollapse} header={header}>
            <SidebarSection label={'Overview'} collapsed={collapsed}>
                {renderGroup('overview')}
            </SidebarSection>
            <SidebarSection label={'Configuration'} collapsed={collapsed}>
                {renderGroup('configuration')}
            </SidebarSection>
            <SidebarSection label={'Management'} collapsed={collapsed}>
                {renderGroup('management')}
                {rootAdmin && (
                    <SidebarExternalLink
                        href={`/admin/servers/view/${internalId}`}
                        icon={faExternalLinkAlt}
                        label={'Admin View'}
                        collapsed={collapsed}
                    />
                )}
            </SidebarSection>
        </Sidebar>
    );
};

export default ServerSidebar;
