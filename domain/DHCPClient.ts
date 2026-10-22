import { createSocket, type Socket } from "node:dgram";
import DHCPSession from "./DHCPSession";
import crypto from "crypto";
import DHCPMessage from "../process/DHCPMessage";
import DHCPParser from "./DHCPParser";

const DHCPMessageType = {
    DISCOVER: 1,
    OFFER: 2,
    REQUEST: 3,
    ACK: 5
} as const;

class DHCPClient {
    private socket: Socket = createSocket("udp4");
    private session: DHCPSession | null = null;

    start(port: number = 6800): void {
        this.socket.on("message", (message, remote) => {
            try {
                const dhcpMessage = DHCPParser.ParseDHCP(message);
                console.log(`Receive ${message.length} bytes from ${remote.address}:${remote.port}`);

                switch (dhcpMessage.getMessageType()) {
                    case DHCPMessageType.OFFER:
                        this.request(dhcpMessage);
                        break;
                    case DHCPMessageType.ACK:
                        if (!this.session || dhcpMessage.xid !== this.session.transactionId) {
                            throw new Error("Received DHCP ACK for an unknown transaction.");
                        }
                        this.session.receiveAck();
                        console.log(`DHCP session is ${this.session.getState()}.`);
                        break;
                    default:
                        throw new Error(`Unexpected DHCP message type: ${dhcpMessage.getMessageType()}.`);
                }
            } catch (error) {
                console.error("Failed to handle DHCP server message:", error);
            }
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
        const xid = crypto.randomInt(2 ** 32);
        this.session = new DHCPSession("CLIENT", xid);
        const action = this.session.startDiscover();
        const message = new DHCPMessage(1, 0, xid);
        message.addOption(53, Buffer.from([DHCPMessageType[action]]));
        this.send(message.encapsulate(), 6700);
        console.log(`Sent ${action}; DHCP session is ${this.session.getState()}.`);
    }

    request(offerMessage: DHCPMessage): void {
        if (!this.session) throw new Error("Error: DHCP session is not initiated");
        if (offerMessage.xid !== this.session.transactionId) {
            throw new Error("Received DHCP OFFER for an unknown transaction.");
        }

        this.session.receiveOffer();
        const action = this.session.startRequest();
        const offeredAddress = offerMessage.getAddress("y");
        const requestMessage = new DHCPMessage(1, 0, this.session.transactionId);
        requestMessage.addOption(53, Buffer.from([DHCPMessageType[action]]));
        requestMessage.addOption(50, Buffer.from(offeredAddress.split(".").map(Number)));
        const serverIdentifier = offerMessage.getOption(54);
        if (serverIdentifier) requestMessage.addOption(54, serverIdentifier);

        this.send(requestMessage.encapsulate(), 6700);
        console.log(`Sent ${action}; DHCP session is ${this.session.getState()}.`);
    }
}

export default DHCPClient;