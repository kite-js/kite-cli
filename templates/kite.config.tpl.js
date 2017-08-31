exports.template = `
import { Config } from 'kite-framework';
import { errors } from '$errors$';

export const kiteConfig: Config = {
    errors: errors,
    hostname: '$hostname$',
    port: $port$
};
`;
