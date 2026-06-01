import React from 'react';
import BoringAvatar, { AvatarProps } from 'boring-avatars';
import { useStoreState } from '@/state/hooks';

const palette = ['#7c83ff', '#5b63f5', '#4f46e5', '#a855f7', '#312e81'];

type Props = Omit<AvatarProps, 'colors'>;

const _Avatar = ({ variant = 'beam', ...props }: AvatarProps) => (
    <BoringAvatar colors={palette} variant={variant} {...props} />
);

const _UserAvatar = ({ variant = 'beam', size, ...props }: Omit<Props, 'name'>) => {
    const uuid = useStoreState((state) => state.user.data?.uuid);
    const avatar = useStoreState((state) => state.user.data?.avatar);

    if (avatar) {
        return (
            <img
                src={avatar}
                alt={'avatar'}
                width={size}
                height={size}
                style={{ width: size, height: size, objectFit: 'cover' }}
            />
        );
    }

    return <BoringAvatar colors={palette} name={uuid || 'system'} variant={variant} size={size} {...props} />;
};

_Avatar.displayName = 'Avatar';
_UserAvatar.displayName = 'Avatar.User';

const Avatar = Object.assign(_Avatar, {
    User: _UserAvatar,
});

export default Avatar;
