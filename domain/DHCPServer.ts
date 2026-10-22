import { createSocket, type Socket } from "node:dgram";
import DHCPParser from "./DHCPParser";
import fs from "node:fs";
import path from "node:path";



class DHCPServer {
    private socket: Socket = createSocket("udp4");

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

    offer(): void {}

    close(): void {
        this.socket.close();
    }
}

export default DHCPServer;