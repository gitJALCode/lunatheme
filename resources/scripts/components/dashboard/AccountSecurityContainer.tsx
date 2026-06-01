import React from 'react';
import tw from 'twin.macro';
import { faKey, faLock } from '@fortawesome/free-solid-svg-icons';
import SettingsCard from '@/components/dashboard/SettingsCard';
import UpdatePasswordForm from '@/components/dashboard/forms/UpdatePasswordForm';
import ConfigureTwoFactorForm from '@/components/dashboard/forms/ConfigureTwoFactorForm';
import FlashMessageRender from '@/components/FlashMessageRender';

export default () => (
    <div>
        <h1 css={tw`text-2xl font-bold text-neutral-100`}>Security</h1>
        <p css={tw`text-sm text-neutral-400 mb-6`}>Manage your password and two-step verification</p>

        <div css={tw`space-y-6`}>
            <SettingsCard icon={faLock} title={'Update Password'}>
                <FlashMessageRender byKey={'account:password'} css={tw`mb-4`} />
                <UpdatePasswordForm />
            </SettingsCard>
            <SettingsCard icon={faKey} title={'Two-Step Verification'}>
                <ConfigureTwoFactorForm />
            </SettingsCard>
        </div>
    </div>
);
