import DHCPMessage from "../process/DHCPMessage";

class DHCPParser {
    static getXID(packet: Buffer): number {
        const xid = packet.readUInt32BE(4);

        return xid;
    } 
}

function readIPv4(packet: Buffer, offset: number): string {
    return Array.from(packet.subarray(offset, offset + 4)).join(".");
}

function readMac(packet: Buffer, offset: number, length: number): string {
    return Array.from(packet.subarray(offset, offset + length))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join(":");
}

export const ParseDHCP = (packet: Buffer): DHCPMessage => {
    if (packet.length < 240) throw new Error("DHCP packet is too short");
    if (packet.readUInt32BE(236) !== 0x63825363) {
        throw new Error("Invalid DHCP magic cookie");
    }

    const op = packet.readUInt8(0);
    const htype = packet.readUInt8(1);
    const hlen = packet.readUInt8(2);
    const hops = packet.readUInt8(3);
    const xid = packet.readUInt32BE(4);
    const secs = packet.readUInt16BE(8);
    const flags = packet.readUInt16BE(10);

    const ciaddr = readIPv4(packet, 12);
    const yiaddr = readIPv4(packet, 16);
    const siaddr = readIPv4(packet, 20);
    const giaddr = readIPv4(packet, 24);
    const chaddr = readMac(packet, 28, hlen);
    const sname = packet.subarray(44, 108)   // 64-byte field
                        .toString("utf8")
                        .replace(/\0.*$/, "");  // remove null padding
    
    const dhcpMessage = new DHCPMessage(op, hops, xid, sname);
    
    dhcpMessage.setAddress(ciaddr, 'c');
    dhcpMessage.setAddress(yiaddr, 'y');
    dhcpMessage.setAddress(siaddr, 's');
    dhcpMessage.setAddress(giaddr, 'g');
    dhcpMessage.setAddress(chaddr, 'c', true);

    let offset = 240;
    while (offset < packet.length) {
        const code = packet.readUInt8(offset++);

        if (code === 0) continue;     // padding
        if (code === 255) break;      // end of options
        if (offset >= packet.length) throw new Error(`Option ${code} has no length`);

        const length = packet.readUInt8(offset++);
        if (offset + length > packet.length) {
            throw new Error(`Option ${code} exceeds the packet`);
        }

        dhcpMessage.addOption(code);
        offset += length;
    }

    return dhcpMessage
}

export default DHCPParser;