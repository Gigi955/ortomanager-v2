// Script Node.js per trovare l'IP locale della rete WiFi/LAN
const os = require('os');
const interfaces = os.networkInterfaces();
let ip = null;

for (const name of Object.keys(interfaces)) {
  for (const iface of interfaces[name]) {
    if (
      iface.family === 'IPv4' &&
      !iface.internal &&
      !iface.address.startsWith('172.') &&
      !iface.address.startsWith('169.')
    ) {
      ip = iface.address;
      break;
    }
  }
  if (ip) break;
}

process.stdout.write(ip || 'NON_TROVATO');
