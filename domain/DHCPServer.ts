import { createSocket, type Socket } from "node:dgram";
import DHCPParser from "./DHCPParser";
import fs from "node:fs";
import path from "node:path";
import DHCPMessage from "../process/DHCPMessage";
import DHCPSession from "./DHCPSession";
import crypto from "crypto";

class DHCPServer {
    private socket: Socket = createSocket("udp4");
    private session: DHCPSession | null = null;

    start(port: number = 6700): void {
        this.socket.on("message", async (message, remote) => {
            try {
                const dhcpMessage = DHCPParser.ParseDHCP(message);
                console.log(`Received ${message.length} bytes from ${remote.address}:${remote.port}`);
                fs.writeFileSync(path.join(__dirname, "dhcp", `${dhcpMessage.xid}_state.json`), JSON.stringify(dhcpMessage));
                console.dir(dhcpMessage);
            } catch (error) {
                console.error(`Failed to parse DHCP packet from ${remote.address}:${remote.port}:`, error);
            }
        });

        this.socket.on("error", (error) => {
            console.error("DHCP server socket error:", error);
        });

        this.socket.on("listening", () => {
            console.log(`This socket is listening on port ${port}`)
        })

        this.socket.bind(port, "127.0.0.1");
    }

    send(packet: Buffer, clientPort: number): void {
        this.socket.send(packet, clientPort, "127.0.0.1", (error) => {
            if (error) console.error("DHCP server send failed:", error);
        });
    }

    close(): void {
        this.socket.close();
    }

    offer(discoverMessage: DHCPMessage): void {
        const xid = discoverMessage.xid;
        this.session = new DHCPSession("SERVER", xid);
        this.session.receiveRequest();

        // Create offer request.
        const offerMessage = new DHCPMessage(2, 0, xid);
        const rnd = crypto.randomInt(100, 220);
        const offeredIP: string = `192.100.80.${rnd}`;

        offerMessage.setAddress("y", offeredIP);
        offerMessage.addOption(54);

        const packet = offerMessage.encapsulate();

        this.send(packet, 6800);
    }

    
}

export default DHCPServer;