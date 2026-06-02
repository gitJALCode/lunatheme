import React, { useEffect } from 'react';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import LunaLogo from '@/components/elements/LunaLogo';

const Wrapper = styled.div`
    ${tw`w-full flex flex-col items-center justify-center px-4 text-center`};
    min-height: 100vh;
`;

const Card = styled.div`
    ${tw`bg-neutral-700 border border-neutral-600 rounded-2xl shadow-2xl p-10 max-w-md w-full`};
`;

const Action = styled(Link)`
    ${tw`inline-block mt-6 px-6 py-3 rounded-xl text-sm font-semibold text-white no-underline`};
    background-image: linear-gradient(135deg, #5b63f5, #4f46e5);

    &:hover {
        ${tw`opacity-90`};
    }
`;

interface Props {
    success: boolean;
}

export default ({ success }: Props) => {
    useEffect(() => {
        document.title = success ? 'Order Complete' : 'Order Cancelled';
    }, [success]);

    return (
        <Wrapper>
            <Card>
                <div css={tw`flex justify-center mb-6`}>
                    <LunaLogo size={48} />
                </div>
                <FontAwesomeIcon
                    icon={success ? faCheckCircle : faTimesCircle}
                    css={[tw`w-12 h-12 mb-4`, success ? tw`text-green-400` : tw`text-red-400`]}
                />
                <h2 css={tw`text-2xl font-semibold text-neutral-100`}>
                    {success ? 'Payment confirmed' : 'Checkout cancelled'}
                </h2>
                <p css={tw`text-sm text-neutral-400 mt-2`}>
                    {success
                        ? 'Thank you! Your server is being created and will appear on your dashboard in a few moments.'
                        : 'No charge was made. You can head back and pick a plan whenever you are ready.'}
                </p>
                {success ? (
                    <Action to={'/'}>Go to my servers</Action>
                ) : (
                    <Action to={'/order'}>Back to plans</Action>
                )}
            </Card>
        </Wrapper>
    );
};
