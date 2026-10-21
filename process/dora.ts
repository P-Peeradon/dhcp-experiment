import { v4 } from "uuid";

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
    private xid: string = v4();
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

    constructor(op: OP, hops: number, xid: string, sname: string) {
        this.op = op;
        this.hops = hops;
        this.xid = xid;
        this.sname = sname;
    }

    encapsulate() {

    }
};

export default DHCPMessage;