import { Container } from '@cloudflare/containers';

export class PythonRunner extends Container {
  // Historical class/binding name retained so existing Durable Objects migrate safely.
  defaultPort = 8080;
  sleepAfter = '1m';
  enableInternet = false;
}
