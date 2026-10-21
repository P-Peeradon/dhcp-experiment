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
    private chaddr: string = ""; // MAC Address before getting IP address
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
        packet.writeUint8(this.op, 0);
        packet.writeUint8(this.htype, 1);
        packet.writeUint8(this.hlen, 2);
        packet.writeUint8(this.hops, 3);
        packet.writeUInt32BE(this.xid, 4);
        packet.writeUInt16BE(this.secs, 8);
        packet.writeUInt16BE(0x8000, 10);
        

        return packet;
    }
};

export default DHCPMessage;