type DHCPRole = "CLIENT" | "SERVER";
type DHCPAction = "DISCOVER" | "OFFER" | "REQUEST" | "ACK";
type DHCPState = 
    "DHCPSELECTING" | 
    "DHCPOFFER" | 
    "DHCPREQUEST" | 
    "DHCPACK" | 
    "DHCPINIT" | 
    "DHCPBOUND"; 

class DHCPSession {
    private state: DHCPState;
    private readonly role: DHCPRole;

    constructor(role: DHCPRole, readonly transactionId: number) {
        this.role = role;
        this.state = role === "CLIENT" ? "DHCPINIT" : "DHCPINIT";
    }

    getState(): DHCPState {
        return this.state;
    }

    setState(next: DHCPState): void {
        this.state = next;
    } 

    startDiscover(): DHCPAction {
        this.requireRole("CLIENT");
        this.requireState("DHCPINIT");

        this.state = "DHCPSELECTING";
        return "DISCOVER";
    }

    receiveDiscover(): void {
        this.requireRole("SERVER");
        this.requireState("DHCPINIT");

        this.state = "DHCPREQUEST";
    }

    receiveOffer(): void {
        this.requireRole("CLIENT");
        this.requireState("DHCPREQUEST");

        this.state = "DHCPOFFER";
    }

    receiveRequest(): void {
        this.requireRole("SERVER");
        this.requireState("DHCPOFFER");

        this.state = "DHCPREQUEST";
    }

    receiveAck(): void {
        this.requireRole("CLIENT");
        this.requireState("DHCPREQUEST");

        this.state = "DHCPACK";
    }

    private requireRole(expected: DHCPRole): void {
        if (this.role !== expected) {
            throw new Error(`This operation requires a ${expected} session.`);
        }
    }

    private requireState(expected: DHCPState): void {
        if (this.state !== expected) {
            throw new Error(`Expected state ${expected}, got ${this.state}.`);
        }
    }
}



export default DHCPSession;