import { Platform } from 'react-native';

// For Web, we use the global RTCPeerConnection
// For React Native, we would typically use react-native-webrtc
// We remove hardcoded Platform checks to allow the environment to provide the APIs.

export class WebRTCService {
    private peerConnection: RTCPeerConnection | null = null;
    private localStream: MediaStream | null = null;
    private remoteStream: MediaStream | null = null;
    private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
    private onIceCandidateCallback: ((candidate: any) => void) | null = null;

    private config = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ]
    };

    constructor() {
        // Attempt to initialize if RTCPeerConnection is available globally
        if (typeof RTCPeerConnection !== 'undefined') {
            this.peerConnection = new RTCPeerConnection(this.config);
            this.setupListeners();
        } else {
            console.warn('RTCPeerConnection is not available in this environment.');
        }
    }

    private setupListeners() {
        if (!this.peerConnection) return;

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate && this.onIceCandidateCallback) {
                this.onIceCandidateCallback(event.candidate);
            }
        };

        this.peerConnection.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                this.remoteStream = event.streams[0];
                if (this.onRemoteStreamCallback) {
                    this.onRemoteStreamCallback(this.remoteStream);
                }
            }
        };
    }

    async getLocalStream(video: boolean = true) {
        try {
            // Check for mediaDevices availability
            if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                this.localStream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: video
                });

                this.localStream.getTracks().forEach(track => {
                    if (this.peerConnection && this.localStream) {
                        this.peerConnection.addTrack(track, this.localStream);
                    }
                });

                return this.localStream;
            } else {
                console.error('navigator.mediaDevices.getUserMedia is not available.');
                return null;
            }
        } catch (error) {
            console.error('Error getting local stream:', error);
            throw error;
        }
    }

    async createOffer() {
        if (!this.peerConnection) return null;
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        return offer;
    }

    async handleOffer(offer: RTCSessionDescriptionInit) {
        if (!this.peerConnection) return null;
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        return answer;
    }

    async handleAnswer(answer: RTCSessionDescriptionInit) {
        if (!this.peerConnection) return;
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
    }

    async addIceCandidate(candidate: RTCIceCandidateInit) {
        if (!this.peerConnection) return;
        try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
            console.error('Error adding ice candidate', e);
        }
    }

    onRemoteStream(callback: (stream: MediaStream) => void) {
        this.onRemoteStreamCallback = callback;
    }

    onIceCandidate(callback: (candidate: any) => void) {
        this.onIceCandidateCallback = callback;
    }

    close() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        if (this.peerConnection) {
            this.peerConnection.close();
        }
        this.peerConnection = null;
        this.localStream = null;
        this.remoteStream = null;
    }
}
