import React, { useEffect, useMemo, useState } from 'react';
import { Server } from '@/api/server/getServer';
import getServers from '@/api/getServers';
import { getFolders, ServerFolder } from '@/api/account/folders';
import ServerRow from '@/components/dashboard/ServerRow';
import FolderRow from '@/components/dashboard/folders/FolderRow';
import FolderModal from '@/components/dashboard/folders/FolderModal';
import Spinner from '@/components/elements/Spinner';
import PageContentBlock from '@/components/elements/PageContentBlock';
import useFlash from '@/plugins/useFlash';
import { useStoreState } from 'easy-peasy';
import { usePersistedState } from '@/plugins/usePersistedState';
import Switch from '@/components/elements/Switch';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import useSWR from 'swr';
import { PaginatedResult } from '@/api/http';
import Pagination from '@/components/elements/Pagination';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFolderPlus } from '@fortawesome/free-solid-svg-icons';

const SearchBar = styled.div`
    ${tw`bg-neutral-700 border border-neutral-600 rounded-xl flex items-center px-4 py-3 mb-4`};

    & input {
        ${tw`flex-1 bg-transparent border-none outline-none text-sm text-neutral-100 ml-3`};

        &::placeholder {
            ${tw`text-neutral-400`};
        }
    }
`;

const CreateFolderButton = styled.button`
    ${tw`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-medium text-neutral-300 border-2 border-dashed border-neutral-600 transition-colors duration-150`};

    &:hover {
        ${tw`border-primary-600 text-neutral-100`};
    }
`;

const TogglePill = styled.div`
    ${tw`flex items-center gap-3 bg-neutral-700 border border-neutral-600 rounded-full px-4 py-2`};
`;

export default () => {
    const { search } = useLocation();
    const defaultPage = Number(new URLSearchParams(search).get('page') || '1');

    const [page, setPage] = useState(!isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);
    const [query, setQuery] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<ServerFolder | null>(null);

    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const uuid = useStoreState((state) => state.user.data!.uuid);
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [showOnlyAdmin, setShowOnlyAdmin] = usePersistedState(`${uuid}:show_all_servers`, false);

    const { data: servers, error } = useSWR<PaginatedResult<Server>>(
        ['/api/client/servers', showOnlyAdmin && rootAdmin, page],
        () => getServers({ page, type: showOnlyAdmin && rootAdmin ? 'admin' : undefined })
    );

    const { data: folders, mutate: mutateFolders } = useSWR<ServerFolder[]>(
        '/api/client/folders',
        () => getFolders(),
        { shouldRetryOnError: false, revalidateOnFocus: false }
    );

    useEffect(() => {
        setPage(1);
    }, [showOnlyAdmin]);

    useEffect(() => {
        if (!servers) return;
        if (servers.pagination.currentPage > 1 && !servers.items.length) {
            setPage(1);
        }
    }, [servers?.pagination.currentPage]);

    useEffect(() => {
        window.history.replaceState(null, document.title, `/${page <= 1 ? '' : `?page=${page}`}`);
    }, [page]);

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'dashboard', error });
        if (!error) clearFlashes('dashboard');
    }, [error]);

    const folderMap = useMemo(() => {
        const map = new Map<string, number>();
        (folders || []).forEach((folder) => folder.servers.forEach((s) => map.set(s, folder.id)));
        return map;
    }, [folders]);

    const matches = (server: Server) =>
        !query.trim() || server.name.toLowerCase().includes(query.trim().toLowerCase());

    return (
        <PageContentBlock title={'Dashboard'} showFlashKey={'dashboard'}>
            <FolderModal
                open={modalOpen}
                folder={editing}
                servers={servers?.items || []}
                onClose={() => {
                    setModalOpen(false);
                    setEditing(null);
                }}
                onSuccess={() => mutateFolders()}
            />

            {rootAdmin && (
                <div css={tw`mb-4 flex justify-end`}>
                    <TogglePill>
                        <p css={tw`uppercase text-xs font-medium text-neutral-300 tracking-wide`}>
                            {showOnlyAdmin ? "Showing others' servers" : 'Showing your servers'}
                        </p>
                        <Switch
                            name={'show_all_servers'}
                            defaultChecked={showOnlyAdmin}
                            onChange={() => setShowOnlyAdmin((s) => !s)}
                        />
                    </TogglePill>
                </div>
            )}

            <SearchBar>
                <FontAwesomeIcon icon={faSearch} css={tw`text-neutral-400 w-4 h-4`} />
                <input
                    type={'text'}
                    placeholder={'Search servers...'}
                    value={query}
                    onChange={(e) => setQuery(e.currentTarget.value)}
                />
            </SearchBar>

            {!servers ? (
                <Spinner centered size={'large'} />
            ) : (
                <Pagination data={servers} onPageSelect={setPage}>
                    {({ items }) => {
                        const visible = items.filter(matches);
                        const ungrouped = visible.filter((s) => !folderMap.has(s.uuid));
                        const activeFolders = (folders || []).filter((folder) => {
                            const folderServers = visible.filter((s) => folder.servers.includes(s.uuid));
                            return folderServers.length > 0 || !query.trim();
                        });

                        return (
                            <div css={tw`space-y-2`}>
                                {activeFolders.map((folder) => (
                                    <FolderRow
                                        key={folder.id}
                                        folder={folder}
                                        servers={items.filter((s) => folder.servers.includes(s.uuid))}
                                        onEdit={() => {
                                            setEditing(folder);
                                            setModalOpen(true);
                                        }}
                                        onChanged={() => mutateFolders()}
                                    />
                                ))}

                                <CreateFolderButton
                                    onClick={() => {
                                        setEditing(null);
                                        setModalOpen(true);
                                    }}
                                >
                                    <FontAwesomeIcon icon={faFolderPlus} />
                                    Create Folder
                                </CreateFolderButton>

                                {ungrouped.length > 0
                                    ? ungrouped.map((server) => <ServerRow key={server.uuid} server={server} />)
                                    : items.length === 0 && (
                                          <p css={tw`text-center text-sm text-neutral-400 py-6`}>
                                              {showOnlyAdmin
                                                  ? 'There are no other servers to display.'
                                                  : 'There are no servers associated with your account.'}
                                          </p>
                                      )}
                            </div>
                        );
                    }}
                </Pagination>
            )}
        </PageContentBlock>
    );
};
