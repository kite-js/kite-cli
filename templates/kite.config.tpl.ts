import { Config, HttpRouterProvider } from 'kite-framework';
import { errors } from '$errors$';
import * as path from 'path';

export const kiteConfig: Config = {
    errors: errors,
    router: HttpRouterProvider(path.join(__dirname, 'controllers'), '.controller.js'),
};
