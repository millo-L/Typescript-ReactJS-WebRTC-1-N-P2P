# Typescript-react-webrtc-1-N

## Features
- 1:N communication (peer to peer)
- React with Typescript
- Node.js as a Signaling server
- Docker

## How to start

### 1. Docker version
```sh
# server use 8080 port
# web use 8085 port
# You can connect to http://localhost:8085
docker-compose up -d
```

### 2. Non-Docker version(Node.js and React.js)
You need to install Node.js
```sh
cd Typescript-react-webrtc-1-N
npm install
node server.js
cd web
npm install
npm start
```

### If you want to increase the total number of people change server.js file
```js
// change maximum value
16 const maximum = 4;
```

### Previous Upload was... 
- 1:1 (peer to peer) WebRTC https://github.com/Seung3837/Typescript-react-webrtc-1-1

### More Details...
- https://velog.io/@seung3837/WebRTC-%EA%B5%AC%ED%98%84%ED%95%98%EA%B8%B01N-P2P

### Next Upload is...
- 1:1 SFU WebRTC
