import { createSocket, type Socket } from "node:dgram";
import DHCPSession from "./DHCPSession";
import crypto from 'crypto';
import DHCPMessage from "../process/DHCPMessage";

class DHCPClient {
    private socket: Socket = createSocket("udp4");
    private session: DHCPSession | null = null;

    start(port: number = 6800):  void {
        this.socket.on("message", (message, remote) => {
            console.log(`Receive ${message.length} bytes from ${remote.address}:${remote.port}`); 
        });

        this.socket.on("error", (error) => {
            console.error("DHCP server socket error:", error);
        });

        this.socket.bind(port, "127.0.0.1");
    }

    send(packet: Buffer, serverPort: number): void {
        this.socket.send(packet, serverPort, "127.0.0.1", (error) => {
            if (error) console.error("DHCP client send failed:", error);
        });
    }

    close(): void {
        this.socket.close();
    }

    // For sending discover message.
    discover(): void {
        const xid = crypto.randomInt(2 ** 32); // For use throughout 
        this.session = new DHCPSession("CLIENT", xid);
        const message = new DHCPMessage(1, 0, xid);
        message.addOption(53);

        const packet= message.encapsulate();

        
        this.send(packet, 6700);
    }

    request(offerMessage: DHCPMessage): void {
        const xid = offerMessage.xid;
        if (!this.session) throw new Error("Error: DHCP session is not initiated");

        const offeredAddress = offerMessage.getAddress("y");

        const requestMessage = new DHCPMessage(1, 0, xid);
        requestMessage.setAddress(offeredAddress, "c");

        const packet = requestMessage.encapsulate();
        this.session.setState('DHCPREQUEST')

        this.send(packet, 6700);
    }
}

export default DHCPClient;