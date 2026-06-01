import React from 'react';
import { NavLink } from 'react-router-dom';
import styled, { css } from 'styled-components/macro';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
    faAngleLeft,
    faAngleRight,
    faMoon,
    faSun,
    faChevronUp,
    faSignOutAlt,
} from '@fortawesome/free-solid-svg-icons';
import { useStoreActions, useStoreState } from '@/state/hooks';
import LunaLogo from '@/components/elements/LunaLogo';
import Avatar from '@/components/Avatar';
import http from '@/api/http';

export const SIDEBAR_WIDTH = 248;
export const SIDEBAR_COLLAPSED_WIDTH = 76;

export const LayoutWrapper = styled.div`
    ${tw`flex min-h-screen w-full`};
`;

export const MainArea = styled.main`
    ${tw`flex-1 min-w-0 min-h-screen bg-neutral-800`};
`;

const Aside = styled.aside<{ $collapsed: boolean }>`
    ${tw`bg-neutral-900 border-r border-neutral-700 flex flex-col flex-shrink-0 sticky top-0 h-screen z-30 transition-all duration-200`};
    width: ${({ $collapsed }) => ($collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH)}px;
`;

const IconButton = styled.button`
    ${tw`h-8 w-8 inline-flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-700 transition-colors duration-150`};
`;

const SectionLabel = styled.p<{ $collapsed: boolean }>`
    ${tw`uppercase text-2xs font-semibold tracking-widest text-neutral-400 px-3 mt-5 mb-2`};
    ${({ $collapsed }) => $collapsed && tw`text-center px-0`};
`;

const NavScroll = styled.nav`
    ${tw`flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4`};
`;

const linkStyles = css<{ $collapsed: boolean }>`
    ${tw`flex items-center gap-3 px-3 py-2.5 my-0.5 rounded-lg text-sm font-medium text-neutral-300 no-underline transition-colors duration-150`};
    ${({ $collapsed }) => $collapsed && tw`justify-center px-0`};

    &:hover {
        ${tw`bg-neutral-700 text-neutral-100`};
    }

    &.active {
        ${tw`bg-primary-600 text-white`};
    }

    & svg {
        ${tw`w-4 h-4 flex-shrink-0`};
    }
`;

const StyledNavLink = styled(NavLink)<{ $collapsed: boolean }>`
    ${linkStyles};
`;

const StyledExternalLink = styled.a<{ $collapsed: boolean }>`
    ${linkStyles};
`;

interface SidebarProps {
    collapsed: boolean;
    onToggleCollapse: () => void;
    header?: React.ReactNode;
    children: React.ReactNode;
}

const Sidebar = ({ collapsed, onToggleCollapse, header, children }: SidebarProps) => {
    const themeMode = useStoreState((state) => state.theme.mode);
    const toggleTheme = useStoreActions((actions) => actions.theme.toggle);
    const username = useStoreState((state) => state.user.data?.username);
    const email = useStoreState((state) => state.user.data?.email);

    const onLogout = () => {
        http.post('/auth/logout').finally(() => {
            // @ts-expect-error this is valid
            window.location = '/';
        });
    };

    return (
        <Aside $collapsed={collapsed}>
            <div css={tw`flex items-center justify-between px-4 h-16 flex-shrink-0`}>
                <div css={tw`flex items-center`}>
                    <LunaLogo size={collapsed ? 30 : 34} />
                </div>
                {!collapsed && (
                    <div css={tw`flex items-center gap-1`}>
                        <IconButton
                            onClick={() => toggleTheme()}
                            title={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            <FontAwesomeIcon icon={themeMode === 'dark' ? faSun : faMoon} fixedWidth />
                        </IconButton>
                        <IconButton onClick={onToggleCollapse} title={'Collapse sidebar'}>
                            <FontAwesomeIcon icon={faAngleLeft} fixedWidth />
                        </IconButton>
                    </div>
                )}
            </div>

            {collapsed && (
                <div css={tw`flex justify-center pb-2`}>
                    <IconButton onClick={onToggleCollapse} title={'Expand sidebar'}>
                        <FontAwesomeIcon icon={faAngleRight} fixedWidth />
                    </IconButton>
                </div>
            )}

            {header && !collapsed && <div css={tw`px-4 pb-3`}>{header}</div>}

            <NavScroll>{children}</NavScroll>

            <div css={tw`border-t border-neutral-700 p-3 flex-shrink-0`}>
                <div
                    css={[
                        tw`flex items-center gap-3 rounded-lg px-2 py-2`,
                        collapsed ? tw`justify-center` : tw``,
                    ]}
                >
                    <div css={tw`h-9 w-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-primary-600`}>
                        <Avatar.User size={36} />
                    </div>
                    {!collapsed && (
                        <>
                            <div css={tw`flex-1 min-w-0`}>
                                <p css={tw`text-sm font-medium text-neutral-100 truncate`}>{username}</p>
                                <p css={tw`text-xs text-neutral-400 truncate`}>{email}</p>
                            </div>
                            <IconButton onClick={onLogout} title={'Sign out'}>
                                <FontAwesomeIcon icon={faSignOutAlt} fixedWidth />
                            </IconButton>
                        </>
                    )}
                </div>
            </div>
        </Aside>
    );
};

interface NavItemProps {
    to: string;
    icon: IconDefinition;
    label: string;
    exact?: boolean;
    collapsed: boolean;
}

export const SidebarLink = ({ to, icon, label, exact = false, collapsed }: NavItemProps) => (
    <StyledNavLink to={to} exact={exact} $collapsed={collapsed} title={collapsed ? label : undefined}>
        <FontAwesomeIcon icon={icon} fixedWidth />
        {!collapsed && <span css={tw`truncate`}>{label}</span>}
    </StyledNavLink>
);

interface ExternalProps {
    href: string;
    icon: IconDefinition;
    label: string;
    collapsed: boolean;
}

export const SidebarExternalLink = ({ href, icon, label, collapsed }: ExternalProps) => (
    <StyledExternalLink href={href} target={'_blank'} rel={'noreferrer'} $collapsed={collapsed} title={label}>
        <FontAwesomeIcon icon={icon} fixedWidth />
        {!collapsed && <span css={tw`truncate`}>{label}</span>}
    </StyledExternalLink>
);

export const SidebarSection = ({
    label,
    collapsed,
    children,
}: {
    label?: string;
    collapsed: boolean;
    children: React.ReactNode;
}) => (
    <div>
        {label && <SectionLabel $collapsed={collapsed}>{collapsed ? '•' : label}</SectionLabel>}
        {children}
    </div>
);

// Re-export for convenience.
export { faChevronUp };

export default Sidebar;
