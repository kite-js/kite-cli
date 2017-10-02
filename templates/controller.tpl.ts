import { Controller, Entry, KiteError, Inject } from 'kite-framework';

@Controller()
export class $NAME$Controller {
    @Entry()
    async exec() {
        throw new KiteError(1000, 'this api is not implemented');
    }
}
