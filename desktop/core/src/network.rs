use if_addrs::{IfAddr, Interface};
use serde::Serialize;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalAddress {
    pub interface_name: String,
    pub ip: String,
    pub prefix_length: u8,
}
#[derive(Clone, Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalNetwork {
    pub addresses: Vec<LocalAddress>,
    pub error: Option<String>,
}
fn addresses(interfaces: Vec<Interface>) -> Vec<LocalAddress> {
    let mut result = Vec::new();
    for interface in interfaces {
        if !interface.is_oper_up() || interface.is_loopback() {
            continue;
        }
        if let IfAddr::V4(address) = interface.addr {
            if address.ip.is_unspecified() || address.ip.is_multicast() || address.ip.is_broadcast()
            {
                continue;
            }
            result.push(LocalAddress {
                interface_name: interface.name,
                ip: address.ip.to_string(),
                prefix_length: address.prefixlen,
            });
        }
    }
    result.sort_by(|a, b| (&a.interface_name, &a.ip).cmp(&(&b.interface_name, &b.ip)));
    result.dedup_by(|a, b| a.interface_name == b.interface_name && a.ip == b.ip);
    result
}
/// Enumerate local adapters without contacting the TV or an Internet service.
pub fn read() -> LocalNetwork {
    match if_addrs::get_if_addrs() {
        Ok(interfaces) => LocalNetwork {
            addresses: addresses(interfaces),
            error: None,
        },
        Err(error) => LocalNetwork {
            addresses: Vec::new(),
            error: Some(format!("无法读取本机网络地址：{error}")),
        },
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    use if_addrs::{IfOperStatus, Ifv4Addr};
    fn interface(name: &str, ip: &str, up: bool) -> Interface {
        Interface {
            name: name.into(),
            addr: IfAddr::V4(Ifv4Addr {
                ip: ip.parse().unwrap(),
                netmask: "255.255.255.0".parse().unwrap(),
                prefixlen: 24,
                broadcast: None,
            }),
            index: None,
            oper_status: if up {
                IfOperStatus::Up
            } else {
                IfOperStatus::Down
            },
            is_p2p: false,
            #[cfg(windows)]
            adapter_name: name.into(),
        }
    }
    #[test]
    fn lists_active_ipv4_adapters_without_loopback_or_duplicates() {
        let rows = addresses(vec![
            interface("loopback", "127.0.0.1", true),
            interface("Wi-Fi", "192.168.0.2", true),
            interface("Ethernet", "10.0.0.2", true),
            interface("disconnected", "192.168.9.2", false),
            interface("unset", "0.0.0.0", true),
            interface("Wi-Fi", "192.168.0.2", true),
        ]);
        assert_eq!(rows.len(), 2);
        assert_eq!(rows[0].interface_name, "Ethernet");
        assert_eq!(rows[1].ip, "192.168.0.2");
        assert_eq!(rows[1].prefix_length, 24);
        assert!(addresses(vec![]).is_empty());
    }
}
