type DHCPRole = "CLIENT" | "SERVER";
type DHCPAction = "DISCOVER" | "OFFER" | "REQUEST" | "ACK";
type DHCPState =
    "DHCPINIT" |
    "DHCPSELECTING" |
    "DHCPOFFER" |
    "DHCPREQUEST" |
    "DHCPBOUND";

class DHCPSession {
    private state: DHCPState;
    private readonly role: DHCPRole;

    constructor(role: DHCPRole, readonly transactionId: number) {
        this.role = role;
        this.state = "DHCPINIT";
    }

    getState(): DHCPState {
        return this.state;
    }

    startDiscover(): DHCPAction {
        this.requireRole("CLIENT");
        this.requireState("DHCPINIT");

        this.state = "DHCPSELECTING";
        return "DISCOVER";
    }

    receiveDiscover(): DHCPAction {
        this.requireRole("SERVER");
        this.requireState("DHCPINIT");

        this.state = "DHCPOFFER";
        return "OFFER";
    }

    receiveOffer(): void {
        this.requireRole("CLIENT");
        this.requireState("DHCPSELECTING");

        this.state = "DHCPOFFER";
    }

    startRequest(): DHCPAction {
        this.requireRole("CLIENT");
        this.requireState("DHCPOFFER");

        this.state = "DHCPREQUEST";
        return "REQUEST";
    }

    receiveRequest(): void {
        this.requireRole("SERVER");
        this.requireState("DHCPOFFER");

        this.state = "DHCPREQUEST";
    }

    sendAck(): DHCPAction {
        this.requireRole("SERVER");
        this.requireState("DHCPREQUEST");

        this.state = "DHCPBOUND";
        return "ACK";
    }

    receiveAck(): void {
        this.requireRole("CLIENT");
        this.requireState("DHCPREQUEST");

        this.state = "DHCPBOUND";
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