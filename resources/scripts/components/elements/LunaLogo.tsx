import React from 'react';

interface Props {
    size?: number;
    className?: string;
}

// The Luna mark: a circle split vertically — indigo gradient on the left,
// white on the right — evoking a crescent moon.
export default ({ size = 32, className }: Props) => (
    <svg
        width={size}
        height={size}
        viewBox={'0 0 48 48'}
        fill={'none'}
        xmlns={'http://www.w3.org/2000/svg'}
        className={className}
    >
        <defs>
            <linearGradient id={'luna-grad'} x1={'0'} y1={'0'} x2={'48'} y2={'48'} gradientUnits={'userSpaceOnUse'}>
                <stop stopColor={'#7c83ff'} />
                <stop offset={'1'} stopColor={'#4f46e5'} />
            </linearGradient>
        </defs>
        <circle cx={'24'} cy={'24'} r={'24'} fill={'#ffffff'} />
        <path d={'M24 0 A24 24 0 0 0 24 48 Z'} fill={'url(#luna-grad)'} />
    </svg>
);
