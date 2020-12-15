import React, { useState } from 'react';
import io from 'socket.io-client';
import { useRef } from 'react';
import { useEffect } from 'react';
import Video from 'Components/Video';

const App = () => {

  const [socket, setSocket] = useState<SocketIOClient.Socket>();
  const [users, setUsers] = useState<Array<IWebRTCUser>>([]);

  let localVideoRef = useRef<HTMLVideoElement>(null);

  let pcs: any;
  
  const pc_config = {
    "iceServers": [
      // {
      //   urls: 'stun:[STUN_IP]:[PORT]',
      //   'credentials': '[YOR CREDENTIALS]',
      //   'username': '[USERNAME]'
      // },
      {
        urls : 'stun:stun.l.google.com:19302'
      }
    ]
  }

  useEffect(() => {
    let newSocket = io.connect('http://localhost:9080');
    let localStream: MediaStream;

    newSocket.on('all_users', (allUsers: Array<{id: string, email: string}>) => {
      let len = allUsers.length;

      for (let i = 0; i < len; i++) {
        createPeerConnection(allUsers[i].id, allUsers[i].email, newSocket, localStream);
        let pc: RTCPeerConnection = pcs[allUsers[i].id];
        if (pc) {
          pc.createOffer({offerToReceiveAudio: true, offerToReceiveVideo: true})
          .then(sdp => {
            console.log('create offer success');
            pc.setLocalDescription(new RTCSessionDescription(sdp));
            newSocket.emit('offer', {
              sdp: sdp,
              offerSendID: newSocket.id,
              offerSendEmail: 'offerSendSample@sample.com',
              offerReceiveID: allUsers[i].id
            });
          })
          .catch(error => {
            console.log(error);
          })
        }
      }
    });
  
    newSocket.on('getOffer', (data: {sdp: RTCSessionDescription, offerSendID: string, offerSendEmail: string}) => {

      console.log('get offer');
      createPeerConnection(data.offerSendID, data.offerSendEmail, newSocket, localStream);
      let pc: RTCPeerConnection = pcs[data.offerSendID];
      if (pc) {
        pc.setRemoteDescription(new RTCSessionDescription(data.sdp)).then(() => {
          console.log('answer set remote description success');
          pc.createAnswer({offerToReceiveVideo: true, offerToReceiveAudio: true})
          .then(sdp => {
            
           console.log('create answer success');
            pc.setLocalDescription(new RTCSessionDescription(sdp));
            newSocket.emit('answer', {
              sdp: sdp, 
              answerSendID: newSocket.id,
              answerReceiveID: data.offerSendID
            });
          })
          .catch(error => {
            console.log(error);
          })
        })
      }
    });
  
    newSocket.on('getAnswer', (data: {sdp: RTCSessionDescription, answerSendID: string}) => {
      
      console.log('get answer');
      let pc: RTCPeerConnection = pcs[data.answerSendID];
      if (pc) {
        pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      }
      //console.log(sdp);
    });
  
    newSocket.on('getCandidate', (data: {candidate: RTCIceCandidateInit, candidateSendID: string}) => {
      console.log('get candidate');
      let pc: RTCPeerConnection = pcs[data.candidateSendID];
      if (pc) {
        pc.addIceCandidate(new RTCIceCandidate(data.candidate)).then(() => {
          console.log('candidate add success');
        })
      }
    });
 
    newSocket.on('user_exit', (data: {id: string}) => {
      delete pcs[data.id];
      setUsers(oldUsers => oldUsers.filter(user => user.id !== data.id));
    })

    setSocket(newSocket);

    navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        width: 240,
        height: 240
      }
    }).then(stream => {
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      localStream = stream;

      newSocket.emit('join_room', {room: '1234', email: 'sample@naver.com'});
      
    }).catch(error => {
      console.log(`getUserMedia error: ${error}`);
    });
    
    

  }, []);

  const createPeerConnection = (socketID: string, email: string, newSocket: SocketIOClient.Socket, localStream: MediaStream): RTCPeerConnection => {

    let pc = new RTCPeerConnection(pc_config);

    // add pc to peerConnections object
    pcs = {...pcs, [socketID]: pc};

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        console.log('onicecandidate');
        newSocket.emit('candidate', {
          candidate: e.candidate,
          candidateSendID: newSocket.id,
          candidateReceiveID: socketID
        });
      }
    }

    pc.oniceconnectionstatechange = (e) => {
      console.log(e);
    }

    pc.ontrack = (e) => {
      console.log('ontrack success');
      setUsers(oldUsers => oldUsers.filter(user => user.id !== socketID));
      setUsers(oldUsers => [...oldUsers, {
        id: socketID,
        email: email,
        stream: e.streams[0]
      }]);
    }

    pc.close = () => {
      console.log('pc closed');
      // alert('GONE')
    }

    if (localStream){
      console.log('localstream add');
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    } else {
      console.log('no local stream');
    }

    // return pc
    return pc;

  }

  return (
    <div>
        <video
          style={{
            width: 240,
            height: 240,
            margin: 5,
            backgroundColor: 'black'
          }}
          muted
          ref={ localVideoRef }
          autoPlay>
        </video>
        {users.map((user, index) => {
          return(
            <Video
              key={index}
              email={user.email}
              stream={user.stream}
            />
          );
        })}
      </div>
  );
}

export default App;
