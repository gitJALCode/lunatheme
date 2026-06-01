import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faPencilAlt, faTrashAlt, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import { ServerFolder, deleteFolder } from '@/api/account/folders';
import { Server } from '@/api/server/getServer';
import ServerRow from '@/components/dashboard/ServerRow';
import { Dialog } from '@/components/elements/dialog';
import useFlash from '@/plugins/useFlash';

const Row = styled.div`
    ${tw`bg-neutral-700 border border-neutral-600 rounded-xl px-4 py-3 flex items-center gap-4`};
`;

const IconButton = styled.button`
    ${tw`h-8 w-8 inline-flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-600 transition-colors duration-150`};
`;

interface Props {
    folder: ServerFolder;
    servers: Server[];
    onEdit: () => void;
    onChanged: () => void;
}

export default ({ folder, servers, onEdit, onChanged }: Props) => {
    const [expanded, setExpanded] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const { clearAndAddHttpError } = useFlash();

    const onDelete = () => {
        deleteFolder(folder.id)
            .then(() => {
                setConfirmDelete(false);
                onChanged();
            })
            .catch((error) => clearAndAddHttpError({ key: 'dashboard', error }));
    };

    return (
        <div>
            <Dialog.Confirm
                open={confirmDelete}
                onClose={() => setConfirmDelete(false)}
                title={`Delete "${folder.name}"`}
                confirm={'Delete Folder'}
                onConfirmed={onDelete}
            >
                Servers in this folder will not be deleted, only the folder itself.
            </Dialog.Confirm>
            <Row>
                <div
                    css={tw`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0`}
                    style={{ backgroundColor: `${folder.color}26`, color: folder.color }}
                >
                    <FontAwesomeIcon icon={faFolder} />
                </div>
                <div
                    css={tw`flex-1 min-w-0 cursor-pointer`}
                    onClick={() => servers.length > 0 && setExpanded((e) => !e)}
                >
                    <p css={tw`text-sm font-semibold text-neutral-100 truncate`}>{folder.name}</p>
                    <p css={tw`text-xs text-neutral-400`}>
                        {servers.length} {servers.length === 1 ? 'server' : 'servers'}
                    </p>
                </div>
                <div css={tw`flex items-center gap-1`}>
                    <IconButton onClick={onEdit} title={'Edit folder'}>
                        <FontAwesomeIcon icon={faPencilAlt} css={tw`w-3.5 h-3.5`} />
                    </IconButton>
                    <IconButton onClick={() => setConfirmDelete(true)} title={'Delete folder'}>
                        <FontAwesomeIcon icon={faTrashAlt} css={tw`w-3.5 h-3.5`} />
                    </IconButton>
                    <IconButton
                        onClick={() => servers.length > 0 && setExpanded((e) => !e)}
                        title={expanded ? 'Collapse' : 'Expand'}
                    >
                        <FontAwesomeIcon
                            icon={faChevronRight}
                            css={[tw`w-3.5 h-3.5 transition-transform duration-150`, expanded ? tw`rotate-90` : tw``]}
                        />
                    </IconButton>
                </div>
            </Row>
            {expanded && (
                <div css={tw`mt-2 ml-6 pl-4 border-l border-neutral-700 space-y-2`}>
                    {servers.map((server) => (
                        <ServerRow key={server.uuid} server={server} />
                    ))}
                </div>
            )}
        </div>
    );
};
