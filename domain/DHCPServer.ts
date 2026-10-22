import { createSocket, type Socket } from "node:dgram";

class DHCPServer {
    private socket: Socket = createSocket("udp4");

    start(port: number = 6700):  void {
        this.socket.on("message", (message, remote) => {
            console.log(`Receive ${message.length} bytes from ${remote.address}:${remote.port}`); 
        });

        this.socket.on("error", (error) => {
            console.error("DHCP server socket error:", error);
        });

        this.socket.on("listening", () => {
            console.log(`This socket is listening on port ${port}`)
        })

        this.socket.bind(port, "127.0.0.1");
    }

    close(): void {
        this.socket.close();
    }
}

export default DHCPServer;