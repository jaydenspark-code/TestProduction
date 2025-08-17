type WebRTCOptions = {
  iceServers?: RTCIceServer[];
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onIceCandidate?: (candidate: RTCIceCandidate | null) => void;
  onTrack?: (track: MediaStreamTrack, streams: MediaStream[]) => void;
  onDataChannel?: (channel: RTCDataChannel) => void;
  onNegotiationNeeded?: () => void;
  onIceConnectionStateChange?: (state: RTCIceConnectionState) => void;
  onIceGatheringStateChange?: (state: RTCIceGatheringState) => void;
};

type DataChannelOptions = {
  ordered?: boolean;
  maxPacketLifeTime?: number;
  maxRetransmits?: number;
  protocol?: string;
  negotiated?: boolean;
  id?: number;
  onMessage?: (event: MessageEvent) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
};

export class WebRTCManager {
  private static instance: WebRTCManager;
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private options: WebRTCOptions;

  private constructor(options: WebRTCOptions = {}) {
    this.options = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      ...options
    };
  }

  static getInstance(options?: WebRTCOptions): WebRTCManager {
    if (!WebRTCManager.instance) {
      WebRTCManager.instance = new WebRTCManager(options);
    }
    return WebRTCManager.instance;
  }

  // Initialize WebRTC connection
  async initialize(): Promise<void> {
    if (this.peerConnection) {
      await this.cleanup();
    }

    this.peerConnection = new RTCPeerConnection({
      iceServers: this.options.iceServers
    });

    this.setupEventListeners();
  }

  // Create offer
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
  }

  // Create answer
  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);
    return answer;
  }

  // Set remote description
  async setRemoteDescription(
    description: RTCSessionDescriptionInit
  ): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.setRemoteDescription(
      new RTCSessionDescription(description)
    );
  }

  // Add ICE candidate
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  // Create data channel
  createDataChannel(
    label: string,
    options: DataChannelOptions = {}
  ): RTCDataChannel {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    const channel = this.peerConnection.createDataChannel(label, {
      ordered: options.ordered,
      maxPacketLifeTime: options.maxPacketLifeTime,
      maxRetransmits: options.maxRetransmits,
      protocol: options.protocol,
      negotiated: options.negotiated,
      id: options.id
    });

    this.setupDataChannelEvents(channel, options);
    this.dataChannels.set(label, channel);

    return channel;
  }

  // Send data through data channel
  async sendData(label: string, data: string | Blob | ArrayBuffer): Promise<void> {
    const channel = this.dataChannels.get(label);
    if (!channel) {
      throw new Error(`Data channel '${label}' not found`);
    }

    if (channel.readyState !== 'open') {
      throw new Error(`Data channel '${label}' is not open`);
    }

    channel.send(data);
  }

  // Add media stream
  async addStream(stream: MediaStream): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    this.localStream = stream;
    stream.getTracks().forEach(track => {
      this.peerConnection!.addTrack(track, stream);
    });
  }

  // Get local stream
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  // Get remote stream
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  // Get connection state
  getConnectionState(): RTCPeerConnectionState | null {
    return this.peerConnection?.connectionState || null;
  }

  // Get ice connection state
  getIceConnectionState(): RTCIceConnectionState | null {
    return this.peerConnection?.iceConnectionState || null;
  }

  // Close connection and cleanup
  async cleanup(): Promise<void> {
    // Close all data channels
    this.dataChannels.forEach(channel => {
      channel.close();
    });
    this.dataChannels.clear();

    // Stop all tracks in local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Stop all tracks in remote stream
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }

  // Private methods
  private setupEventListeners(): void {
    if (!this.peerConnection) return;

    this.peerConnection.onconnectionstatechange = () => {
      this.options.onConnectionStateChange?.(this.peerConnection!.connectionState);
    };

    this.peerConnection.onicecandidate = (event) => {
      this.options.onIceCandidate?.(event.candidate);
    };

    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      this.options.onTrack?.(event.track, event.streams);
    };

    this.peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      this.dataChannels.set(channel.label, channel);
      this.options.onDataChannel?.(channel);
    };

    this.peerConnection.onnegotiationneeded = () => {
      this.options.onNegotiationNeeded?.();
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      this.options.onIceConnectionStateChange?.(
        this.peerConnection!.iceConnectionState
      );
    };

    this.peerConnection.onicegatheringstatechange = () => {
      this.options.onIceGatheringStateChange?.(
        this.peerConnection!.iceGatheringState
      );
    };
  }

  private setupDataChannelEvents(
    channel: RTCDataChannel,
    options: DataChannelOptions
  ): void {
    channel.onmessage = (event) => {
      options.onMessage?.(event);
    };

    channel.onopen = () => {
      options.onOpen?.();
    };

    channel.onclose = () => {
      options.onClose?.();
    };

    channel.onerror = (event) => {
      options.onError?.(event);
    };
  }
}

// Example usage:
/*
const webrtc = WebRTCManager.getInstance({
  onConnectionStateChange: (state) => {
    console.log('Connection state:', state);
  },
  onIceCandidate: (candidate) => {
    if (candidate) {
      // Send candidate to remote peer via signaling server
      signalingServer.send({
        type: 'candidate',
        candidate: candidate
      });
    }
  },
  onTrack: (track, streams) => {
    console.log('Received track:', track);
    // Add track to remote video element
    const remoteVideo = document.querySelector('video#remote');
    remoteVideo.srcObject = streams[0];
  }
});

// Initialize connection
await webrtc.initialize();

// Create data channel
const channel = webrtc.createDataChannel('chat', {
  ordered: true,
  onMessage: (event) => {
    console.log('Received message:', event.data);
  },
  onOpen: () => {
    console.log('Channel opened');
  }
});

// Add local stream
const stream = await navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
});
await webrtc.addStream(stream);

// Create and send offer
const offer = await webrtc.createOffer();
signalingServer.send({
  type: 'offer',
  offer: offer
});

// Handle incoming answer
signalingServer.on('answer', async (answer) => {
  await webrtc.setRemoteDescription(answer);
});

// Handle incoming ICE candidates
signalingServer.on('candidate', async (candidate) => {
  await webrtc.addIceCandidate(candidate);
});

// Send message
await webrtc.sendData('chat', 'Hello!');

// Cleanup when done
await webrtc.cleanup();
*/