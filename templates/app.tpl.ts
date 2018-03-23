import { Kite } from 'kite-framework';

new Kite('./kite.config')
    .watch()
    .fly($port$, '$hostname$');
