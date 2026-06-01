import React from 'react';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faUser, faShieldAlt, faKey, faTerminal, faHistory } from '@fortawesome/free-solid-svg-icons';
import ContentContainer from '@/components/elements/ContentContainer';

interface Item {
    to: string;
    label: string;
    icon: IconDefinition;
    exact?: boolean;
}

const items: Item[] = [
    { to: '/account', label: 'Profile', icon: faUser, exact: true },
    { to: '/account/security', label: 'Security', icon: faShieldAlt, exact: true },
    { to: '/account/api', label: 'API Credentials', icon: faKey },
    { to: '/account/ssh', label: 'SSH Keys', icon: faTerminal },
    { to: '/account/activity', label: 'Activity', icon: faHistory },
];

const NavItem = styled(NavLink)`
    ${tw`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-neutral-300 no-underline transition-colors duration-150`};

    & svg {
        ${tw`w-4 h-4 flex-shrink-0`};
    }

    &:hover {
        ${tw`bg-neutral-700 text-neutral-100`};
    }

    &.active {
        ${tw`bg-primary-600 text-white`};
    }
`;

const AccountSubNavigation: React.FC = ({ children }) => (
    <ContentContainer css={tw`my-6 sm:my-10`}>
        <div css={tw`flex flex-col lg:flex-row gap-6`}>
            <nav css={tw`w-full lg:w-60 flex-shrink-0`}>
                <div css={tw`flex flex-row lg:flex-col gap-1`}>
                    {items.map((item) => (
                        <NavItem key={item.to} to={item.to} exact={item.exact}>
                            <FontAwesomeIcon icon={item.icon} fixedWidth />
                            <span css={tw`truncate`}>{item.label}</span>
                        </NavItem>
                    ))}
                </div>
            </nav>
            <div css={tw`flex-1 min-w-0`}>{children}</div>
        </div>
    </ContentContainer>
);

export default AccountSubNavigation;
