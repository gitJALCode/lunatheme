import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import OrderContainer from '@/components/store/OrderContainer';
import OrderResultContainer from '@/components/store/OrderResultContainer';

export default () => {
    const { path } = useRouteMatch();

    return (
        <Switch>
            <Route path={`${path}`} component={OrderContainer} exact />
            <Route path={`${path}/success`}>
                <OrderResultContainer success />
            </Route>
            <Route path={`${path}/cancel`}>
                <OrderResultContainer success={false} />
            </Route>
        </Switch>
    );
};
