import DHCPMessage from "../process/dora";

class DHCPParser {
    static getXID(packet: DHCPMessage) {

    } 
}

export const ParseDHCP = (packet: Buffer): DHCPMessage => {
    if (packet.length < 240) throw new Error("DHCP packet is too short");
    if (packet.readUInt32BE(236) !== 0x63825363) {
        throw new Error("Invalid DHCP magic cookie");
    }

    const xid = packet.readUInt32BE(4);
    
    const dhcpMessage = new DHCPMessage(0, xid.toString(), "");

    return dhcpMessage
}

export default DHCPParser;