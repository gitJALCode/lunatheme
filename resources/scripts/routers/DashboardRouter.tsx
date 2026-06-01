import React from 'react';
import { Route, Switch } from 'react-router-dom';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import { NotFound } from '@/components/elements/ScreenBlock';
import TransitionRouter from '@/TransitionRouter';
import { useLocation } from 'react-router';
import Spinner from '@/components/elements/Spinner';
import routes from '@/routers/routes';
import { faCogs, faLayerGroup, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { useStoreState } from '@/state/hooks';
import { usePersistedState } from '@/plugins/usePersistedState';
import Sidebar, { LayoutWrapper, MainArea, SidebarLink, SidebarExternalLink, SidebarSection } from '@/components/elements/sidebar/Sidebar';
import AccountSubNavigation from '@/components/dashboard/AccountSubNavigation';

export default () => {
    const location = useLocation();
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [collapsed, setCollapsed] = usePersistedState<boolean>('luna::sidebar_collapsed', false);
    const onAccount = location.pathname.startsWith('/account');

    return (
        <LayoutWrapper>
            <Sidebar collapsed={!!collapsed} onToggleCollapse={() => setCollapsed((c) => !c)}>
                <SidebarSection label={'Navigation'} collapsed={!!collapsed}>
                    <SidebarLink to={'/'} exact icon={faLayerGroup} label={'Servers'} collapsed={!!collapsed} />
                    <SidebarLink to={'/account'} icon={faUserCircle} label={'Account'} collapsed={!!collapsed} />
                    {rootAdmin && (
                        <SidebarExternalLink href={'/admin'} icon={faCogs} label={'Admin'} collapsed={!!collapsed} />
                    )}
                </SidebarSection>
            </Sidebar>
            <MainArea>
                <TransitionRouter>
                    <React.Suspense fallback={<Spinner centered />}>
                        <Switch location={location}>
                            <Route path={'/'} exact>
                                <DashboardContainer />
                            </Route>
                            {routes.account.map(({ path, component: Component }) => (
                                <Route key={path} path={`/account/${path}`.replace('//', '/')} exact>
                                    {onAccount ? (
                                        <AccountSubNavigation>
                                            <Component />
                                        </AccountSubNavigation>
                                    ) : (
                                        <Component />
                                    )}
                                </Route>
                            ))}
                            <Route path={'*'}>
                                <NotFound />
                            </Route>
                        </Switch>
                    </React.Suspense>
                </TransitionRouter>
            </MainArea>
        </LayoutWrapper>
    );
};
