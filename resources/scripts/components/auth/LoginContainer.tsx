import React, { useEffect, useRef, useState } from 'react';
import { Link, RouteComponentProps } from 'react-router-dom';
import login from '@/api/auth/login';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import { useStoreState } from 'easy-peasy';
import { Formik, FormikHelpers } from 'formik';
import { object, string } from 'yup';
import Field from '@/components/elements/Field';
import tw from 'twin.macro';
import { css } from 'styled-components/macro';
import Button from '@/components/elements/Button';
import Label from '@/components/elements/Label';
import Reaptcha from 'reaptcha';
import useFlash from '@/plugins/useFlash';

interface Values {
    username: string;
    password: string;
}

const LoginContainer = ({ history }: RouteComponentProps) => {
    const ref = useRef<Reaptcha>(null);
    const [token, setToken] = useState('');

    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const { enabled: recaptchaEnabled, siteKey } = useStoreState((state) => state.settings.data!.recaptcha);

    useEffect(() => {
        clearFlashes();
    }, []);

    const onSubmit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes();

        // If there is no token in the state yet, request the token and then abort this submit request
        // since it will be re-submitted when the recaptcha data is returned by the component.
        if (recaptchaEnabled && !token) {
            ref.current!.execute().catch((error) => {
                console.error(error);

                setSubmitting(false);
                clearAndAddHttpError({ error });
            });

            return;
        }

        login({ ...values, recaptchaData: token })
            .then((response) => {
                if (response.complete) {
                    // @ts-expect-error this is valid
                    window.location = response.intended || '/';
                    return;
                }

                history.replace('/auth/login/checkpoint', { token: response.confirmationToken });
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
            initialValues={{ username: '', password: '' }}
            validationSchema={object().shape({
                username: string().required('A username or email must be provided.'),
                password: string().required('Please enter your account password.'),
            })}
        >
            {({ isSubmitting, setSubmitting, submitForm }) => (
                <LoginFormContainer
                    title={'Sign In'}
                    subtitle={'Enter your credentials to continue'}
                    css={tw`w-full flex flex-col`}
                >
                    <Field type={'text'} label={'Email or Username'} name={'username'} disabled={isSubmitting} />
                    <div css={tw`mt-5`}>
                        <div css={tw`flex items-center justify-between`}>
                            <Label htmlFor={'password'}>Password</Label>
                            <Link
                                to={'/auth/password'}
                                css={tw`text-xs text-primary-300 no-underline hover:text-primary-200`}
                            >
                                Forgot Password?
                            </Link>
                        </div>
                        <Field id={'password'} type={'password'} name={'password'} disabled={isSubmitting} />
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
                            Sign In
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
                        New user?{' '}
                        <a href={'/auth/register'} css={tw`text-primary-300 no-underline hover:text-primary-200`}>
                            Register
                        </a>
                    </div>
                </LoginFormContainer>
            )}
        </Formik>
    );
};

export default LoginContainer;
