import crypto from 'crypto';

enum OP {
    BOOTREQUEST = 1,
    BOOTREPLY
}

class DHCPMessage {
    private op: OP;
    private htype: number = 1;
    private hlen: number = 6;
    private hops: number;
    private _xid: number = crypto.randomInt(2 ** 32);
    private secs: number = 0;
    private flags: number = 0;
    private ciaddr: string = "0.0.0.0";
    private yiaddr: string =  "0.0.0.0";
    private siaddr: string = "0.0.0.0";
    private giaddr: string = "0.0.0.0";
    private chaddr: string = "00:00:00:00:00:00"; // MAC Address before getting IP address
    private sname: string;
    private file: string = "";
    private options: Array<{ code: number; value: Buffer }> = [];

    constructor(op: OP, hops: number, xid: number, sname: string = "") {
        this.op = op;
        this.hops = hops;
        this._xid = xid;
        this.sname = sname;
    }

    get xid(): number {
        return this._xid;
    }

    setParsedHeader(fields: {
        htype: number;
        hlen: number;
        secs: number;
        flags: number;
        file: string;
    }): void {
        this.htype = fields.htype;
        this.hlen = fields.hlen;
        this.secs = fields.secs;
        this.flags = fields.flags;
        this.file = fields.file;
    }

    toJSON() {
        return {
            op: this.op,
            htype: this.htype,
            hlen: this.hlen,
            hops: this.hops,
            xid: this._xid,
            secs: this.secs,
            flags: this.flags,
            ciaddr: this.ciaddr,
            yiaddr: this.yiaddr,
            siaddr: this.siaddr,
            giaddr: this.giaddr,
            chaddr: this.chaddr,
            sname: this.sname,
            file: this.file,
            magicCookie: "63825363",
            options: this.options.map(({ code, value }) => ({
                code,
                length: value.length,
                value: Array.from(value)
            }))
        };
    }

    getMessageType(): number | undefined {
        return this.getOption(53)?.[0];
    }

    setAddress(address: string, owner: string, mac: boolean = false): void {
        if (owner.length !== 1) throw Error("Invalid value, type of address should be only one letter.");

        if (mac && owner !== 'c') 
            throw Error("DHCP only support client's MAC address.");
        else if (mac && owner === 'c') {
            this.chaddr = address; return;
        } else {
            switch (owner.toLowerCase()) {
                case "c":
                    this.ciaddr = address
                    break;

                case "y":
                    this.yiaddr = address
                    break;

                case "s":
                    this.siaddr = address
                    break;

                case "g":
                    this.giaddr = address
                    break;

                default:
                    throw Error("Invalid address entry.");
            }
        }
          
    }

    getAddress(owner: string, mac: boolean = false): string {
        if (owner.length !== 1) throw Error("Invalid value, type of address should be only one letter.");

        if (mac && owner !== 'c') 
            throw Error("DHCP only support client's MAC address.");
        else if (mac && owner === 'c') {
            return this.chaddr;
        } else {
            switch (owner.toLowerCase()) {
                case "c":
                    return this.ciaddr;

                case "y":
                    return this.yiaddr;

                case "s":
                    return this.siaddr;

                case "g":
                    return this.giaddr;

                default:
                    throw Error("Invalid address entry.");
            }
        }
          
    }

    addOption(code: number, value: Buffer = Buffer.alloc(0)): void {
        this.options.push({ code, value });
    }

    getOption(code: number): Buffer | undefined {
        return this.options.find((option) => option.code === code)?.value;
    }

    encapsulate(): Buffer<ArrayBuffer> {
        const optionLength = this.options.reduce(
            (length, option) => length + 2 + option.value.length,
            1
        );
        const packet: Buffer<ArrayBuffer> = Buffer.alloc(240 + optionLength);
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

        sname.copy(packet, 44);
        packet.writeUInt32BE(0x63825363, 236);

        let offset = 240;
        for (const option of this.options) {
            packet.writeUInt8(option.code, offset++);
            packet.writeUInt8(option.value.length, offset++);
            option.value.copy(packet, offset);
            offset += option.value.length;
        }
        packet.writeUInt8(255, offset);

        return packet;
    }
};

export default DHCPMessage;