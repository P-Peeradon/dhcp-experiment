# RFC 2131: Dynamic Host Configuration Protocol

This document summarizes [RFC 2131 Sections 2 and 3.1](https://www.rfc-editor.org/rfc/rfc2131.html#section-2) for the DHCP experiment. It is a guide to the cited sections, not a claim that the experiment implements every requirement in RFC 2131.

## Section 2: Protocol summary

DHCP extends the BOOTP mechanism and uses the BOOTP message format, with DHCP options (including a DHCP message-type option) to identify messages and carry configuration. Unlike BOOTP, DHCP can allocate an address for a finite lease so that addresses can be reassigned later. It can also provide the client with the IP configuration parameters it needs, not just an IP address.

The DHCP service maintains configuration bindings: stored client configuration associated with a client key, normally the subnet and hardware address, or an explicitly supplied client identifier. A client identifier is opaque to the server, must be unique for that client on its subnet, and must remain the same in that client's subsequent messages when used.

An address lease prevents the DHCP allocation mechanism from reassigning that address during the requested period. A client can renew the lease, release the address when finished, or request an infinite lease.

## Section 3.1: Allocating a network address

The normal initial allocation exchange is:

1. **DHCPDISCOVER:** The client broadcasts on its local subnet to locate servers. It may suggest an address or lease duration. A BOOTP relay agent may forward the message to servers on other subnets.
2. **DHCPOFFER:** Each server may offer an available address in `yiaddr` and other configuration in DHCP options. A client may receive multiple offers and choose one. A server should check that an address being newly allocated is not already in use; it need not reserve an offered address, though avoiding reassignment of an outstanding offer is more efficient.
3. **DHCPREQUEST:** The client broadcasts its selection. It must include the selected server's identifier and request the address offered in that server's `yiaddr`. It uses the same `secs` value and broadcast destination as its DISCOVER so relay agents can forward the request to the same servers. This also notifies unselected servers that their offers were declined.
4. **DHCPACK or DHCPNAK:** The selected server commits the client binding and sends an ACK with the configuration and assigned address. The ACK should not conflict with the selected offer. If the server cannot satisfy the request, it should send a NAK. On receiving an ACK, the client records the lease and should check that the address is not already in use. If it detects a conflict, it must send DHCPDECLINE and restart; it should wait at least ten seconds before restarting.

If no offer arrives, the client retransmits DISCOVER. If neither ACK nor NAK arrives, it retransmits REQUEST according to the protocol's retry algorithm and restarts initialization if retries fail. On NAK, it restarts initialization. A client may send DHCPRELEASE to relinquish its lease; if it used a client identifier to obtain the lease, it must use the same identifier in RELEASE.

## Experiment requirements from Sections 2 and 3.1

- Store client configuration as bindings, using a stable client key, and prevent an address from being reassigned during its lease.
- Implement the DISCOVER/OFFER/REQUEST/ACK exchange, including server selection, request options, relay-compatible broadcast details, and binding commitment.
- Handle address conflict checks, DHCPDECLINE, DHCPNAK, retransmissions/timeouts, and optional DHCPRELEASE as described above.
- Preserve the RFC's normative strength: **MUST** is mandatory, **SHOULD** is recommended unless there are valid reasons to deviate, and **MAY** is optional.

## Related RFC 2131 design goals (Section 1.6)

These additional goals are relevant to experiment scope but are outside the requested Sections 2 and 3.1 summary:

- DHCP is a mechanism rather than a policy engine. Administrators control allocation and configuration policy; clients should discover and apply configuration without user intervention, and networks should not need per-client manual configuration under normal circumstances. This does not remove the need to configure the network's DHCP service and address pool.
- DHCP should work across routers, through BOOTP relay agents, without requiring a server on every subnet. Clients must be prepared for multiple server responses.
- DHCP must coexist with statically configured, non-participating hosts and existing network protocols, interoperate with BOOTP relay agents, and provide service to existing BOOTP clients.
- DHCP must avoid assigning one address to multiple DHCP clients at the same time and should retain client configuration across client or server restarts, returning the same configuration whenever possible.

## Session state updates in this implementation

The client and server each maintain a `DHCPSession` for the transaction ID (`xid`). Call the transition method when the corresponding packet is sent or received:

| DORA event | Side | Method call | State after call |
| --- | --- | --- | --- |
| Client sends DISCOVER | Client | `startDiscover()` | `DHCPSELECTING` |
| Server receives DISCOVER | Server | `receiveDiscover()` | `DHCPOFFER` |
| Client receives OFFER | Client | `receiveOffer()` | `DHCPOFFER` |
| Client sends REQUEST | Client | `startRequest()` | `DHCPREQUEST` |
| Server receives REQUEST | Server | `receiveRequest()` | `DHCPREQUEST` |
| Server sends ACK | Server | `sendAck()` | `DHCPBOUND` |
| Client receives ACK | Client | `receiveAck()` | `DHCPBOUND` |

These calls are wired into the message handlers in `domain/DHCPClient.ts` and `domain/DHCPServer.ts`. `getState()` can be used to inspect the current state; transitions validate the session role and expected prior state.

## DHCP message format used by the experiment

- The DHCP payload starts with a 236-byte BOOTP header. Multi-byte integers use network byte order:
  - `op` (1 byte) = 1 for BOOTREQUEST or 2 for BOOTREPLY.
  - `htype` (1 byte) = hardware address type; `hlen` (1 byte) = hardware address length; `hops` (1 byte) = relay-agent hop count.
  - `xid` (4 bytes) = transaction ID; `secs` (2 bytes) = seconds elapsed; `flags` (2 bytes) = flags including the broadcast bit.
  - `ciaddr`, `yiaddr`, `siaddr`, and `giaddr` (4 bytes each) = client, offered client, next-server, and relay-agent IPv4 addresses.
  - `chaddr` (16 bytes) = client hardware address; `sname` (64 bytes) = optional server name; `file` (128 bytes) = boot file name.
- At byte offset 236, DHCP adds the magic cookie `63 82 53 63`, followed by variable-length options. Each option has a code and length byte followed by its value; code 0 is padding and code 255 ends the option field. Option 52 causes the `file` and/or `sname` fields to be parsed as additional option fields.
- The `DHCPParser` in `domain/DHCPParser.ts` parses a UDP DHCP payload supplied as a `Uint8Array`. It validates the fixed header, cookie, and option boundaries, and returns header fields and option values as bytes.
