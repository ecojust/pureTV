import test from 'node:test';
import assert from 'node:assert/strict';
import {sameSubnet} from '../src/subnet.ts';
const network=(...addresses)=>({addresses:addresses.map(([ip,prefixLength])=>({interfaceName:'test',ip,prefixLength})),error:null});
test('IPv4 subnet masks use the actual prefix, not the first three octets',()=>{
 assert.equal(sameSubnet('192.168.0.191',network(['192.168.0.2',24])),true);
 assert.equal(sameSubnet('192.168.1.191',network(['192.168.0.2',24])),false);
 assert.equal(sameSubnet('192.168.1.191',network(['192.168.0.2',16])),true);
 assert.equal(sameSubnet('192.168.0.191',network(['192.168.0.2',25])),false);
 assert.equal(sameSubnet('192.168.0.127',network(['192.168.0.2',25])),true);
 assert.equal(sameSubnet('10.0.0.1',network(['10.0.0.0',31])),true);
 assert.equal(sameSubnet('10.0.0.2',network(['10.0.0.0',31])),false);
 assert.equal(sameSubnet('192.168.0.2',network(['192.168.0.2',32])),true);
 assert.equal(sameSubnet('192.168.0.3',network(['192.168.0.2',32])),false);
 assert.equal(sameSubnet('203.0.113.1',network(['10.0.0.2',0])),true);
});
test('any matching active adapter suffices',()=>{
 assert.equal(sameSubnet('192.168.0.191',network(['10.0.0.2',24],['192.168.0.2',24])),true);
 assert.equal(sameSubnet('172.16.0.191',network(['10.0.0.2',24],['192.168.0.2',24])),false);
});
test('unknown addresses do not cause a false mismatch',()=>{
 for(const host of ['tv.local','::1','[fe80::1]','192.168.0.999','192.168.000.1','192.168.0.1;reboot'])assert.equal(sameSubnet(host,network(['10.0.0.2',24])),null);
 assert.equal(sameSubnet('192.168.0.191',network()),null);
 assert.equal(sameSubnet('192.168.0.191',network(['10.0.0.2',33])),null);
 assert.equal(sameSubnet('192.168.0.191',{...network(['10.0.0.2',24]),error:'unavailable'}),null);
});
