import React, { useRef, useState } from 'react';
import { Actions, State, useStoreActions, useStoreState } from 'easy-peasy';
import { Form, Formik, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
import tw from 'twin.macro';
import { faCamera, faEnvelope, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { ApplicationStore } from '@/state';
import { httpErrorToHuman } from '@/api/http';
import Field from '@/components/elements/Field';
import Label from '@/components/elements/Label';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { Button } from '@/components/elements/button/index';
import MessageBox from '@/components/MessageBox';
import FlashMessageRender from '@/components/FlashMessageRender';
import Avatar from '@/components/Avatar';
import SettingsCard from '@/components/dashboard/SettingsCard';
import { uploadAvatar, removeAvatar } from '@/api/account/avatar';
import { useLocation } from 'react-router-dom';

interface EmailValues {
    email: string;
    password: string;
}

const emailSchema = Yup.object().shape({
    email: Yup.string().email().required(),
    password: Yup.string().required('You must provide your current account password.'),
});

const ProfilePictureCard = () => {
    const fileRef = useRef<HTMLInputElement>(null);
    const [busy, setBusy] = useState(false);
    const { clearFlashes, addFlash } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.currentTarget.files?.[0];
        if (!file) return;
        setBusy(true);
        clearFlashes('account:avatar');
        uploadAvatar(file)
            .then(() => window.location.reload())
            .catch((error) =>
                addFlash({ type: 'error', key: 'account:avatar', title: 'Error', message: httpErrorToHuman(error) })
            )
            .finally(() => setBusy(false));
    };

    const onRemove = () => {
        setBusy(true);
        clearFlashes('account:avatar');
        removeAvatar()
            .then(() => window.location.reload())
            .catch((error) =>
                addFlash({ type: 'error', key: 'account:avatar', title: 'Error', message: httpErrorToHuman(error) })
            )
            .finally(() => setBusy(false));
    };

    return (
        <SettingsCard
            icon={faCamera}
            title={'Profile Picture'}
            description={'Upload a custom avatar for your account. PNG, JPG, WEBP, and GIF are supported up to 4MB.'}
        >
            <FlashMessageRender byKey={'account:avatar'} css={tw`mb-4`} />
            <div css={tw`flex items-center gap-4`}>
                <div css={tw`h-16 w-16 rounded-full overflow-hidden ring-2 ring-primary-600 flex-shrink-0`}>
                    <Avatar.User size={64} />
                </div>
                <input ref={fileRef} type={'file'} accept={'image/*'} css={tw`hidden`} onChange={onFile} />
                <Button disabled={busy} onClick={() => fileRef.current?.click()}>
                    Upload Avatar
                </Button>
                <Button.Danger disabled={busy} onClick={onRemove}>
                    Remove Avatar
                </Button.Danger>
            </div>
        </SettingsCard>
    );
};

const EmailCard = () => {
    const user = useStoreState((state: State<ApplicationStore>) => state.user.data);
    const updateEmail = useStoreActions((state: Actions<ApplicationStore>) => state.user.updateUserEmail);
    const { clearFlashes, addFlash } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const submit = (values: EmailValues, { resetForm, setSubmitting }: FormikHelpers<EmailValues>) => {
        clearFlashes('account:email');
        updateEmail({ ...values })
            .then(() => addFlash({ type: 'success', key: 'account:email', message: 'Your primary email has been updated.' }))
            .catch((error) =>
                addFlash({ type: 'error', key: 'account:email', title: 'Error', message: httpErrorToHuman(error) })
            )
            .then(() => {
                resetForm();
                setSubmitting(false);
            });
    };

    return (
        <SettingsCard icon={faEnvelope} title={'Email Address'}>
            <FlashMessageRender byKey={'account:email'} css={tw`mb-4`} />
            <Formik onSubmit={submit} validationSchema={emailSchema} initialValues={{ email: user!.email, password: '' }}>
                {({ isSubmitting, isValid }) => (
                    <Form css={tw`m-0 relative`}>
                        <SpinnerOverlay size={'large'} visible={isSubmitting} />
                        <div css={tw`grid grid-cols-1 md:grid-cols-2 gap-4`}>
                            <Field id={'current_email'} type={'email'} name={'email'} label={'Email'} />
                            <Field
                                id={'confirm_password'}
                                type={'password'}
                                name={'password'}
                                label={'Confirm Password'}
                            />
                        </div>
                        <div css={tw`mt-6 flex justify-end`}>
                            <Button disabled={isSubmitting || !isValid}>Update Email</Button>
                        </div>
                    </Form>
                )}
            </Formik>
        </SettingsCard>
    );
};

const LanguageCard = () => {
    const { i18n } = useTranslation();
    const [lang, setLang] = useState(i18n.language || 'en');

    const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.currentTarget.value;
        setLang(value);
        i18n.changeLanguage(value);
        try {
            localStorage.setItem('luna::language', value);
        } catch (err) {
            // ignore
        }
    };

    return (
        <SettingsCard
            icon={faGlobe}
            title={'Language'}
            description={'Select your preferred language for the panel interface.'}
        >
            <Label>Language</Label>
            <select
                value={lang}
                onChange={onChange}
                css={tw`w-full md:w-1/2 p-3 rounded bg-neutral-600 border-2 border-neutral-500 text-neutral-200 text-sm`}
            >
                <option value={'en'}>English</option>
                <option value={'de'}>Deutsch</option>
                <option value={'fr'}>Français</option>
                <option value={'es'}>Español</option>
                <option value={'nl'}>Nederlands</option>
            </select>
        </SettingsCard>
    );
};

export default () => {
    const { state } = useLocation<undefined | { twoFactorRedirect?: boolean }>();

    return (
        <div>
            <h1 css={tw`text-2xl font-bold text-neutral-100`}>Profile Settings</h1>
            <p css={tw`text-sm text-neutral-400 mb-6`}>Update your account settings and preferences</p>

            {state?.twoFactorRedirect && (
                <MessageBox title={'2-Factor Required'} type={'error'}>
                    Your account must have two-factor authentication enabled in order to continue.
                </MessageBox>
            )}

            <div css={tw`space-y-6`}>
                <ProfilePictureCard />
                <EmailCard />
                <LanguageCard />
            </div>
        </div>
    );
};
