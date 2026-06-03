import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import register from '@/api/auth/register';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import { useStoreState } from 'easy-peasy';
import { Formik, FormikHelpers } from 'formik';
import { object, ref, string } from 'yup';
import Field from '@/components/elements/Field';
import tw from 'twin.macro';
import { css } from 'styled-components/macro';
import Button from '@/components/elements/Button';
import Reaptcha from 'reaptcha';
import useFlash from '@/plugins/useFlash';

interface Values {
    email: string;
    username: string;
    name_first: string;
    name_last: string;
    password: string;
    password_confirmation: string;
}

const USERNAME_REGEX = /^[a-z0-9]([\w.-]+)[a-z0-9]$/;

export default () => {
    const ref = useRef<Reaptcha>(null);
    const [token, setToken] = useState('');

    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { enabled: recaptchaEnabled, siteKey } = useStoreState((state) => state.settings.data!.recaptcha);

    useEffect(() => {
        clearFlashes();
    }, []);

    const onSubmit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();

        if (recaptchaEnabled && !token) {
            ref.current!.execute().catch((error) => {
                console.error(error);

                setSubmitting(false);
                clearAndAddHttpError({ error });
            });

            return;
        }

        register({ ...values, recaptchaData: token })
            .then((response) => {
                if (response.complete) {
                    // @ts-expect-error this is valid
                    window.location = response.intended || '/';
                }
            })
            .catch((error) => {
                console.error(error);

                setToken('');
                if (ref.current) ref.current.reset();

                setSubmitting(false);
                clearAndAddHttpError({ error });
            });
    };

    return (
        <Formik
            onSubmit={onSubmit}
            initialValues={{
                email: '',
                username: '',
                name_first: '',
                name_last: '',
                password: '',
                password_confirmation: '',
            }}
            validationSchema={object().shape({
                email: string()
                    .email('A valid email address must be provided.')
                    .required('A valid email address must be provided.'),
                username: string()
                    .required('A username is required.')
                    .test(
                        'username-format',
                        'The username must start and end with alpha-numeric characters and contain only letters, numbers, dashes, underscores, and periods.',
                        (value) => !value || USERNAME_REGEX.test(value.toLowerCase())
                    ),
                name_first: string().required('A first name is required.'),
                name_last: string().required('A last name is required.'),
                password: string()
                    .required('A password is required.')
                    .min(8, 'Your password should be at least 8 characters in length.'),
                password_confirmation: string()
                    .required('Your password does not match.')
                    // @ts-expect-error this is valid
                    .oneOf([ref('password'), null], 'Your password does not match.'),
            })}
        >
            {({ isSubmitting, setSubmitting, submitForm }) => (
                <LoginFormContainer
                    title={'Create Account'}
                    subtitle={'Sign up to get started'}
                    css={tw`w-full flex flex-col`}
                >
                    <Field type={'email'} label={'Email'} name={'email'} disabled={isSubmitting} />
                    <div css={tw`mt-5`}>
                        <Field type={'text'} label={'Username'} name={'username'} disabled={isSubmitting} />
                    </div>
                    <div css={tw`mt-5 grid grid-cols-1 sm:grid-cols-2 gap-5`}>
                        <Field type={'text'} label={'First Name'} name={'name_first'} disabled={isSubmitting} />
                        <Field type={'text'} label={'Last Name'} name={'name_last'} disabled={isSubmitting} />
                    </div>
                    <div css={tw`mt-5`}>
                        <Field
                            type={'password'}
                            label={'Password'}
                            name={'password'}
                            description={'Passwords must be at least 8 characters in length.'}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div css={tw`mt-5`}>
                        <Field
                            type={'password'}
                            label={'Confirm Password'}
                            name={'password_confirmation'}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div css={tw`mt-6`}>
                        <Button
                            type={'submit'}
                            size={'xlarge'}
                            isLoading={isSubmitting}
                            disabled={isSubmitting}
                            css={css`
                                background-image: linear-gradient(to right, #6d6af6, #4f46e5);
                                ${tw`border-primary-700 font-semibold`};
                                &:hover:not(:disabled) {
                                    background-image: linear-gradient(to right, #5b58ee, #4338ca);
                                }
                            `}
                        >
                            Register
                        </Button>
                    </div>
                    {recaptchaEnabled && (
                        <Reaptcha
                            ref={ref}
                            size={'invisible'}
                            sitekey={siteKey || '_invalid_key'}
                            onVerify={(response) => {
                                setToken(response);
                                submitForm();
                            }}
                            onExpire={() => {
                                setSubmitting(false);
                                setToken('');
                            }}
                        />
                    )}
                    <div css={tw`mt-5 text-center text-sm text-neutral-400`}>
                        Already have an account?{' '}
                        <Link to={'/auth/login'} css={tw`text-primary-300 no-underline hover:text-primary-200`}>
                            Sign In
                        </Link>
                    </div>
                </LoginFormContainer>
            )}
        </Formik>
    );
};
