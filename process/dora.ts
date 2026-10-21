import crypto from 'crypto';

type DHCPAction = "DISCOVER" | "OFFER" | "REQUEST" | "ACK";
type DHCPState = "DHCPDISCOVER" | "DHCPOFFER" | "DHCPREQUEST" | "DHCPACK" | "DHCPNAK" | "DHCPDECLINE"; 

enum OP {
    BOOTREQUEST = 1,
    BOOTREPLY
}

class DHCPMessage {
    private op: OP;
    private htype: number = 1;
    private hlen: number = 6;
    private hops: number;
    private xid: number = crypto.randomInt(2 ** 32);
    private secs: number = 0;
    private flags: string = "";
    private ciaddr: string = "0.0.0.0";
    private yiaddr: string =  "0.0.0.0";
    private siaddr: string = "0.0.0.0";
    private giaddr: string = "0.0.0.0";
    private chaddr: string = "00:00:00:00:00:00"; // MAC Address before getting IP address
    private sname: string;
    private file: any;
    private options: number[] = []; // Can be variable

    constructor(op: OP, hops: number, xid: number, sname: string) {
        this.op = op;
        this.hops = hops;
        this.xid = xid;
        this.sname = sname;
    }

    encapsulate(): Buffer<ArrayBuffer> {
        const packet: Buffer<ArrayBuffer> = Buffer.alloc(240 + this.options.length);
        const encoder = new TextEncoder();
        
        packet.writeUint8(this.op, 0);
        packet.writeUint8(this.htype, 1);
        packet.writeUint8(this.hlen, 2);
        packet.writeUint8(this.hops, 3);
        packet.writeUInt32BE(this.xid, 4);
        packet.writeUInt16BE(this.secs, 8);
        packet.writeUInt16BE(0x8000, 10);
        
        // Convert addresses into bytes
        const ciaddr: Buffer = Buffer.from(this.ciaddr.split(".").map(Number));
        const yiaddr: Buffer = Buffer.from(this.yiaddr.split(".").map(Number));
        const siaddr: Buffer = Buffer.from(this.siaddr.split(".").map(Number));
        const giaddr: Buffer = Buffer.from(this.giaddr.split(".").map(Number));
        const chaddr: Buffer = Buffer.from(this.chaddr.split(":").map(Number));

        ciaddr.copy(packet, 12);
        yiaddr.copy(packet, 16);
        siaddr.copy(packet, 20);
        giaddr.copy(packet, 24);
        chaddr.copy(packet, 28);

        // From server name to 64 bytes.
        const sname: Buffer = Buffer.from(encoder.encode(this.sname));
        const options = Buffer.from(this.options);

        sname.copy(packet, 44);
        packet.writeUInt32BE(0x63825363, 236);
        options.copy(packet, 240);

        return packet;
    }
};

export default DHCPMessage;