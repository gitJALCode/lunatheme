import React from 'react';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface Props {
    icon: IconDefinition;
    title: string;
    description?: string;
    className?: string;
    children: React.ReactNode;
}

const SettingsCard = ({ icon, title, description, className, children }: Props) => (
    <div css={tw`bg-neutral-700 border border-neutral-600 rounded-xl p-6`} className={className}>
        <div css={tw`flex items-center gap-3 mb-1`}>
            <FontAwesomeIcon icon={icon} css={tw`text-primary-400 w-4 h-4`} />
            <h2 css={tw`text-lg font-semibold text-neutral-100`}>{title}</h2>
        </div>
        {description && <p css={tw`text-sm text-neutral-400 mb-4`}>{description}</p>}
        <div css={description ? tw`` : tw`mt-4`}>{children}</div>
    </div>
);

export default SettingsCard;
