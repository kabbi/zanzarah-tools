import { requireAll } from '../utils/require';

requireAll(require.context('./', false, /^\.\/.*\.js$/));
