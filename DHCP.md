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
- op (1) = Message type 1 = BOOTREQUEST and 2 = BOOTREPLY
- htype (1) = hardware address type 
- hlen (1) = hardware address length
- hops (1) N/A for now
- xid (4) = random ID selected by clients
- secs (2) = second since acquisition, filled by clients.
- ciaddr (2) = only filled in if client is in BOUND, RENEW or REBINDING state and can respond to ARP requests.
- yiaddr (2) = 'your' (client) IP address.
- siaddr (2) = IP address of next server to use in bootstrap; returned in DHCPOFFER, DHCPACK by server.