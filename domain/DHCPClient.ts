import { createSocket, type Socket } from "node:dgram";

class DHCPClient {
    private socket: Socket = createSocket("udp4");

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
}