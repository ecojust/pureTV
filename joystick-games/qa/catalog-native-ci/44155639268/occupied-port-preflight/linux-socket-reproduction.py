import socket,json
listener=socket.socket();listener.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1);listener.bind(('127.0.0.1',0));port=listener.getsockname()[1];listener.listen(1)
client=socket.create_connection(('127.0.0.1',port));peer,_=listener.accept();peer.shutdown(socket.SHUT_WR);assert client.recv(1)==b'';client.close();assert peer.recv(1)==b'';peer.close();listener.close()
plain=socket.socket()
try:plain.bind(('0.0.0.0',port));plain_result='bound'
except OSError as error:plain_result={'errno':error.errno,'message':error.strerror}
finally:plain.close()
blocker=socket.socket();blocker.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1);blocker.bind(('0.0.0.0',port));blocker.listen(1)
competitor=socket.socket();competitor.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1)
try:competitor.bind(('0.0.0.0',port));competitor.listen(1);conflict='unexpected success'
except OSError as error:conflict={'errno':error.errno,'message':error.strerror}
finally:competitor.close();blocker.close()
assert isinstance(plain_result,dict) and isinstance(conflict,dict)
print(json.dumps({'linuxSocketDemonstrationOnly':True,'port':port,'plainBindAfterClosedConnection':plain_result,'reuseAddrBind':'passed','activeListenerStillRejected':conflict,'macFailureRootCauseConfirmed':False}))
