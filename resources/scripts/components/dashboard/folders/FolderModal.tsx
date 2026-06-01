import React, { useEffect, useState } from 'react';
import { Dialog } from '@/components/elements/dialog';
import { createFolder, updateFolder, setFolderServers, ServerFolder } from '@/api/account/folders';
import { Server } from '@/api/server/getServer';
import Input from '@/components/elements/Input';
import Label from '@/components/elements/Label';
import Button from '@/components/elements/Button';
import tw from 'twin.macro';
import useFlash from '@/plugins/useFlash';

const COLORS = ['#4f46e5', '#ec4899', '#a855f7', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#14b8a6'];

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    folder?: ServerFolder | null;
    servers: Server[];
}

export default ({ open, onClose, onSuccess, folder, servers }: Props) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState(COLORS[0]);
    const [selected, setSelected] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const { clearAndAddHttpError, clearFlashes } = useFlash();

    useEffect(() => {
        if (open) {
            setName(folder?.name || '');
            setColor(folder?.color || COLORS[0]);
            setSelected(folder?.servers || []);
        }
    }, [open, folder]);

    const toggleServer = (uuid: string) =>
        setSelected((current) =>
            current.includes(uuid) ? current.filter((u) => u !== uuid) : [...current, uuid]
        );

    const submit = () => {
        if (!name.trim()) return;
        setSubmitting(true);
        clearFlashes('dashboard');

        const request = folder ? updateFolder(folder.id, { name, color }) : createFolder(name, color);
        request
            .then((saved) => setFolderServers(saved.id, selected))
            .then(() => {
                onSuccess();
                onClose();
            })
            .catch((error) => clearAndAddHttpError({ key: 'dashboard', error }))
            .finally(() => setSubmitting(false));
    };

    return (
        <Dialog open={open} onClose={onClose} title={folder ? 'Edit Folder' : 'Create Folder'}>
            <div css={tw`mt-4`}>
                <Label>Folder Name</Label>
                <Input
                    value={name}
                    onChange={(e) => setName(e.currentTarget.value)}
                    placeholder={'e.g. Games'}
                    autoFocus
                />
            </div>
            <div css={tw`mt-4`}>
                <Label>Color</Label>
                <div css={tw`flex flex-wrap gap-2`}>
                    {COLORS.map((c) => (
                        <button
                            key={c}
                            type={'button'}
                            onClick={() => setColor(c)}
                            css={[
                                tw`w-8 h-8 rounded-lg transition-all duration-150`,
                                color === c ? tw`ring-2 ring-offset-2 ring-offset-neutral-700 ring-white` : tw``,
                            ]}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>
            </div>
            {servers.length > 0 && (
                <div css={tw`mt-4`}>
                    <Label>Servers</Label>
                    <div css={tw`max-h-48 overflow-y-auto rounded-lg border border-neutral-600 divide-y divide-neutral-600`}>
                        {servers.map((server) => (
                            <label
                                key={server.uuid}
                                css={tw`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-neutral-600`}
                            >
                                <Input
                                    type={'checkbox'}
                                    checked={selected.includes(server.uuid)}
                                    onChange={() => toggleServer(server.uuid)}
                                />
                                <span css={tw`text-sm text-neutral-200 truncate`}>{server.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
            <Dialog.Footer>
                <Button isSecondary onClick={onClose}>
                    Cancel
                </Button>
                <Button onClick={submit} disabled={submitting || !name.trim()} isLoading={submitting}>
                    {folder ? 'Save' : 'Create'}
                </Button>
            </Dialog.Footer>
        </Dialog>
    );
};
