import ipaddress
import socket
import unittest
from unittest.mock import patch

from host import addresses, GamePage, LoopbackHTTPServer


class NetworkStartupTests(unittest.TestCase):
    def test_loopback_and_lan_setup_do_not_require_dns(self):
        with (
            patch.object(socket, "getfqdn", side_effect=AssertionError("reverse DNS")),
            patch.object(socket, "gethostbyname_ex", side_effect=AssertionError("DNS")),
            LoopbackHTTPServer(("127.0.0.1", 0), GamePage) as server,
        ):
            self.assertEqual(server.server_name, "127.0.0.1")
            self.assertGreater(server.server_port, 0)
            for address in addresses():
                ip = ipaddress.IPv4Address(address)
                self.assertFalse(ip.is_loopback or ip.is_unspecified)
