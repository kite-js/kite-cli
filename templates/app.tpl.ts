import { Kite } from 'kite-framework';

Kite.init('./kite.config')
    .watch()
    .fly($port$, '$hostname$');
