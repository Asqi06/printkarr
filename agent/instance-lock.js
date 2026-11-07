// Windows named pipes are released by the OS when the owning process exits.
import net from 'node:net';
export async function acquireAgentLock(pipe = '\\\\.\\pipe\\printkarr-print-agent') {
  const server = net.createServer(socket => socket.end());
  return new Promise((resolve, reject) => {
    server.once('error', error => error.code === 'EADDRINUSE' ? resolve(null) : reject(error));
    server.listen(pipe, () => resolve(server));
  });
}
