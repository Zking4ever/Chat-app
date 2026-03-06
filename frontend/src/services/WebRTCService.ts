import { Platform } from 'react-native';

export class WebRTCService {
    private peerConnection: RTCPeerConnection | null = null;
    private localStream: MediaStream | null = null;
    private remoteStream: MediaStream | null = null;
    private onRemoteStreamCallback: ((stream: MediaStream) => void) | null = null;
    private onIceCandidateCallback: ((candidate: any) => void) | null = null;
    private onConnectionStateCallback: ((state: RTCPeerConnectionState) => void) | null = null;

    // Buffer ICE candidates that arrive before remote description is set
    private pendingCandidates: RTCIceCandidateInit[] = [];
    private isRemoteDescriptionSet = false;

    private config: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
        ],
        iceCandidatePoolSize: 10,
    };

    constructor() {
        this.initializePeerConnection();
    }

    private initializePeerConnection() {
        if (typeof RTCPeerConnection !== 'undefined') {
            this.peerConnection = new RTCPeerConnection(this.config);
            this.setupListeners();
            console.log('RTCPeerConnection initialized');
        } else {
            console.warn('RTCPeerConnection is not available.');
        }
    }

    private setupListeners() {
        if (!this.peerConnection) return;

        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('Local ICE candidate generated');
                if (this.onIceCandidateCallback) {
                    this.onIceCandidateCallback(event.candidate);
                }
            }
        };

        this.peerConnection.ontrack = (event) => {
            console.log('Remote track received:', event.streams[0]?.id);
            if (event.streams && event.streams[0]) {
                this.remoteStream = event.streams[0];
                if (this.onRemoteStreamCallback) {
                    this.onRemoteStreamCallback(this.remoteStream);
                }
            }
        };

        this.peerConnection.onconnectionstatechange = () => {
            const state = this.peerConnection?.connectionState;
            console.log('Connection state changed:', state);
            if (state && this.onConnectionStateCallback) {
                this.onConnectionStateCallback(state as RTCPeerConnectionState);
            }
        };

        this.peerConnection.oniceconnectionstatechange = () => {
            console.log('ICE connection state changed:', this.peerConnection?.iceConnectionState);
        };

        this.peerConnection.onsignalingstatechange = () => {
            console.log('Signaling state changed:', this.peerConnection?.signalingState);
        };
    }

    async getLocalStream(video: boolean = true) {
        try {
            console.log(`Getting local stream (video: ${video})...`);
            // Standard getUserMedia works for both web and react-native-webrtc
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: video ? {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                } : false
            });

            this.localStream = stream;

            if (this.peerConnection) {
                // Clear existing tracks first to avoid duplicates
                const senders = this.peerConnection.getSenders();
                senders.forEach(sender => this.peerConnection?.removeTrack(sender));

                this.localStream.getTracks().forEach(track => {
                    this.peerConnection?.addTrack(track, this.localStream!);
                });
            }
            return this.localStream;
        } catch (error) {
            console.error('Error getting local stream:', error);
            throw error;
        }
    }

    async createOffer() {
        if (!this.peerConnection) return null;
        try {
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            return offer;
        } catch (error) {
            console.error('Error creating offer:', error);
            return null;
        }
    }

    async handleOffer(offer: RTCSessionDescriptionInit) {
        if (!this.peerConnection) return null;
        try {
            console.log('Handling offer...');
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            this.isRemoteDescriptionSet = true;
            await this.flushPendingCandidates();

            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            return answer;
        } catch (error) {
            console.error('Error handling offer:', error);
            return null;
        }
    }

    async handleAnswer(answer: RTCSessionDescriptionInit) {
        if (!this.peerConnection) return;
        try {
            console.log('Handling answer...');
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            this.isRemoteDescriptionSet = true;
            await this.flushPendingCandidates();
        } catch (error) {
            console.error('Error handling answer:', error);
        }
    }

    async addIceCandidate(candidate: RTCIceCandidateInit) {
        if (!this.peerConnection) return;
        try {
            if (!this.isRemoteDescriptionSet || !this.peerConnection.remoteDescription) {
                console.log('Buffering remote ICE candidate...');
                this.pendingCandidates.push(candidate);
                return;
            }
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('Added remote ICE candidate');
        } catch (e) {
            console.error('Error adding ICE candidate:', e);
        }
    }

    private async flushPendingCandidates() {
        if (this.pendingCandidates.length === 0) return;
        console.log(`Flushing ${this.pendingCandidates.length} ICE candidates...`);
        const candidates = [...this.pendingCandidates];
        this.pendingCandidates = [];
        for (const candidate of candidates) {
            try {
                await this.peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error('Error flushing ICE candidate:', e);
            }
        }
    }

    toggleAudio(enabled: boolean) {
        if (this.localStream) {
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = enabled;
            });
        }
    }

    toggleVideo(enabled: boolean) {
        if (this.localStream) {
            this.localStream.getVideoTracks().forEach(track => {
                track.enabled = enabled;
            });
        }
    }

    onRemoteStream(callback: (stream: MediaStream) => void) {
        this.onRemoteStreamCallback = callback;
        if (this.remoteStream) {
            callback(this.remoteStream);
        }
    }

    onIceCandidate(callback: (candidate: any) => void) {
        this.onIceCandidateCallback = callback;
    }

    onConnectionState(callback: (state: RTCPeerConnectionState) => void) {
        this.onConnectionStateCallback = callback;
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
        this.pendingCandidates = [];
        this.isRemoteDescriptionSet = false;
    }
}
