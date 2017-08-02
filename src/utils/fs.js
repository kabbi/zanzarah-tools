import RemoteFS from './filesystems/RemoteFS';
import { getRootPath } from './paths';

export default new RemoteFS(getRootPath());
