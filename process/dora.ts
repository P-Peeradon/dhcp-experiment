type DHCPAction = "DISCOVER" | "OFFER" | "REQUEST" | "ACK";
type DHCPState = "DHCPDISCOVER" | "DHCPOFFER" | "DHCPREQUEST" | "DHCPACK" | "DHCPNAK" | "DHCPDECLINE"; 

class DHCPMessage {};

export default DHCPMessage;