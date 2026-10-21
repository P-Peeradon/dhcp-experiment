type DHCPAction = "DISCOVER" | "OFFER" | "REQUEST" | "ACK";
type DHCPState = "DHCPDISCOVER" | "DHCPOFFER" | "DHCPREQUEST" | "DHCPACK" | "DHCPNAK" | "DHCPDECLINE"; 

class DHCPMessage {
    private op: number = 1;
    private htype: number = 1;
    private hlen: number = 6;
    private hops: number;
    private xid: string;

    constructor(numHops: number) {
        this.hops = numHops;
    }
};

export default DHCPMessage;