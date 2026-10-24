import { setTimeout as delay } from "node:timers/promises";
import DHCPClient from './domain/DHCPClient';

async function testDora(): Promise<void> {
    const client = new DHCPClient();
    client.start()
    client.discover()
    await delay(500)

    client.close()
}

void testDora().catch((error) => {
    console.error("DORA test failed:", error);
});