import React, { forwardRef } from 'react';
import { Form } from 'formik';
import styled from 'styled-components/macro';
import FlashMessageRender from '@/components/FlashMessageRender';
import tw from 'twin.macro';
import LunaLogo from '@/components/elements/LunaLogo';

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & {
    title?: string;
    subtitle?: string;
};

const Wrapper = styled.div`
    ${tw`w-full flex items-center justify-center px-4`};
    min-height: 100vh;
`;

const Card = styled.div`
    ${tw`flex w-full max-w-4xl bg-neutral-700 rounded-2xl shadow-2xl overflow-hidden`};
    border: 1px solid #272c37;
`;

const FormSide = styled.div`
    ${tw`flex-1 p-8 sm:p-10 flex flex-col justify-center`};
    min-width: 0;
`;

const HeroSide = styled.div`
    ${tw`hidden md:block flex-1 bg-cover bg-center`};
    background-image: url('/assets/luna/login-hero.svg');
`;

export default forwardRef<HTMLFormElement, Props>(({ title, subtitle, ...props }, ref) => (
    <Wrapper>
        <Card>
            <FormSide>
                <div css={tw`flex justify-center mb-6`}>
                    <LunaLogo size={48} />
                </div>
                {title && <h2 css={tw`text-2xl font-semibold text-neutral-100`}>{title}</h2>}
                {subtitle && <p css={tw`text-sm text-neutral-400 mt-1 mb-2`}>{subtitle}</p>}
                <FlashMessageRender css={tw`my-2`} />
                <Form {...props} ref={ref} css={tw`mt-4`}>
                    {props.children}
                </Form>
                <p css={tw`text-center text-neutral-500 text-xs mt-8`}>
                    <a
                        rel={'noopener nofollow noreferrer'}
                        href={'https://pterodactyl.io'}
                        target={'_blank'}
                        css={tw`no-underline text-neutral-500 hover:text-neutral-300`}
                    >
                        Pterodactyl&reg;
                    </a>
                    &nbsp;&copy; 2015 - {new Date().getFullYear()}
                </p>
            </FormSide>
            <HeroSide />
        </Card>
    </Wrapper>
));
