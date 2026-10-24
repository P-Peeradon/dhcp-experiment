import { createSocket, type Socket } from "node:dgram";
import { writeFile } from "node:fs/promises";
import DHCPParser from "./DHCPParser";
import DHCPMessage from "../process/DHCPMessage";
import DHCPSession from "./DHCPSession";
import crypto from "crypto";

const DHCPMessageType = {
    DISCOVER: 1,
    OFFER: 2,
    REQUEST: 3,
    ACK: 5
} as const;

class DHCPServer {
    private socket: Socket = createSocket("udp4");
    private session: DHCPSession | null = null;
    private offeredAddress: string | null = null;

    start(port: number = 6700): void {
        this.socket.on("message", async (message, remote) => {
            try {
                const dhcpMessage = DHCPParser.ParseDHCP(message);
                console.log(`Received ${message.length} bytes from ${remote.address}:${remote.port}`);

                switch (dhcpMessage.getMessageType()) {
                    case DHCPMessageType.DISCOVER:
                        await writeFile(
                            `${dhcpMessage.xid}_dhcp.json`,
                            JSON.stringify(dhcpMessage, null, 2),
                            "utf8"
                        );
                        this.offer(dhcpMessage);
                        break;
                    case DHCPMessageType.REQUEST:
                        this.acknowledge(dhcpMessage);
                        break;
                    default:
                        throw new Error(`Unexpected DHCP message type: ${dhcpMessage.getMessageType()}.`);
                }
            } catch (error) {
                console.error(`Failed to handle DHCP packet from ${remote.address}:${remote.port}:`, error);
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
        const action = this.session.receiveDiscover();

        const offerMessage = new DHCPMessage(2, 0, xid);
        const rnd = crypto.randomInt(100, 220);
        this.offeredAddress = `192.100.80.${rnd}`;

        offerMessage.setAddress(this.offeredAddress, "y");
        offerMessage.addOption(53, Buffer.from([DHCPMessageType[action]]));
        offerMessage.addOption(54, Buffer.from([127, 0, 0, 1]));
        this.send(offerMessage.encapsulate(), 6800);
        console.log(`Sent ${action}; DHCP session is ${this.session.getState()}.`);
    }

    private acknowledge(requestMessage: DHCPMessage): void {
        if (!this.session || requestMessage.xid !== this.session.transactionId) {
            throw new Error("Received DHCP REQUEST for an unknown transaction.");
        }
        const requestedAddress = requestMessage.getOption(50);
        if (
            !this.offeredAddress ||
            !requestedAddress ||
            requestedAddress.join(".") !== this.offeredAddress
        ) {
            throw new Error("DHCP REQUEST does not match the address offered to this client.");
        }

        this.session.receiveRequest();
        const action = this.session.sendAck();
        const ackMessage = new DHCPMessage(2, 0, this.session.transactionId);
        ackMessage.setAddress(this.offeredAddress, "y");
        ackMessage.addOption(53, Buffer.from([DHCPMessageType[action]]));
        ackMessage.addOption(54, Buffer.from([127, 0, 0, 1]));
        this.send(ackMessage.encapsulate(), 6800);
        console.log(`Sent ${action}; DHCP session is ${this.session.getState()}.`);
    }
}

export default DHCPServer;