# RFC2131 Dynamic Hosting Configuration Protocol

## Terminology

- "MUST" = Strictly abide by the process and requirements.
- "MUST NOT" = If implemented, the program's functionality will be incorrect
- "SHOULD" = Recommended to implement for efficiency and optimisation.
- "MAY" = Optional, but implementing them will make product different from other vendors.
- "DHCP Client" = A DHCP client is an Internet host using DHCP to obtain configuration parameters such as a network address. For example, when our computer connect to Wi-Fi, it use DHCP to obtain IP address.
- "DHCP Server" = A DHCP server is an Internet host that returns configuration parameters to DHCP clients. Example, Router.
- "BOOTP relay agent" = an Internet host or router that passes DHCP messages between DHCP clients and DHCP servers.

## Requirement
- DHCP must be only a mechanism to provide IP address to client computer, while preserve static IP address for other server programmes.
- No manual configuration for any devices but
  - Client should be able to broadcast after connected to the Internet.
  - No manual configuration by human on networks, but the devices will provide IP address automatically.
  - No need to have one DHCP per each subnet, but one DHCP server can work across subnets, or may be across routers.
  - DHCP must coexists with non-participating host, such as server computers, and existing network protocol.

## DHCP Protocol
- The process is Discover, Offer, Request, Acknowledge by client-server over UDP protocol on port 67 and 68.
- Discover (D) -> broadcast for finding DHCP server nearby using source address = all 0 and destination address = all 1 (For IPv4 with 32 bits or 4 octets).
- Offer (O) -> The server offer the vacant IP address to the client.
- Request (R) -> The client request to use that address.
- Acknowledge (A) -> The server send the response and record that the host will use that address.

### DHCP Message
- The DHCP payload starts with a 236-byte BOOTP header. Multi-byte integers use network byte order:
  - `op` (1 byte) = 1 for BOOTREQUEST or 2 for BOOTREPLY.
  - `htype` (1 byte) = hardware address type; `hlen` (1 byte) = hardware address length; `hops` (1 byte) = relay-agent hop count.
  - `xid` (4 bytes) = transaction ID; `secs` (2 bytes) = seconds elapsed; `flags` (2 bytes) = flags including the broadcast bit.
  - `ciaddr`, `yiaddr`, `siaddr`, and `giaddr` (4 bytes each) = client, offered client, next-server, and relay-agent IPv4 addresses.
  - `chaddr` (16 bytes) = client hardware address; `sname` (64 bytes) = optional server name; `file` (128 bytes) = boot file name.
- At byte offset 236, DHCP adds the magic cookie `63 82 53 63`, followed by variable-length options. Each option has a code and length byte followed by its value; code 0 is padding and code 255 ends the option field.
- The `DHCPParser` in `domain/DHCPParser.ts` parses a UDP DHCP payload supplied as a `Uint8Array`. It validates the fixed header, cookie, and option boundaries, and returns header fields and option values as bytes. Option 52 causes the `file` and/or `sname` fields to be parsed as additional option fields.