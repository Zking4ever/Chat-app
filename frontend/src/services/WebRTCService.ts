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
        ]
    };

    constructor() {
        this.initializePeerConnection();
    }

    private initializePeerConnection() {
        if (typeof RTCPeerConnection !== 'undefined') {
            this.peerConnection = new RTCPeerConnection(this.config);
            this.setupListeners();
            console.log('Web RTCPeerConnection initialized');
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

        this.peerConnection.onconnectionstatechange = () => {
            if (this.peerConnection) {
                console.log('Connection state changed:', this.peerConnection.connectionState);
                if (this.onConnectionStateCallback) {
                    this.onConnectionStateCallback(this.peerConnection.connectionState);
                }
            }
        };
    }

    async getLocalStream(video: boolean = true) {
        try {
            if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
                this.localStream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false
                });

                if (this.localStream && this.peerConnection) {
                    const senders = this.peerConnection.getSenders();
                    senders.forEach(sender => this.peerConnection?.removeTrack(sender));
                    this.localStream.getTracks().forEach(track => {
                        this.peerConnection?.addTrack(track, this.localStream!);
                    });
                    return this.localStream;
                }
            }
            return null;
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
            if (!this.isRemoteDescriptionSet) {
                // Buffer the candidate until remote description is applied
                console.log('Buffering ICE candidate (remote description not set yet)');
                this.pendingCandidates.push(candidate);
                return;
            }
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
            console.error('Error adding ice candidate', e);
        }
    }

    private async flushPendingCandidates() {
        if (this.pendingCandidates.length === 0) return;
        console.log(`Flushing ${this.pendingCandidates.length} buffered ICE candidates`);
        const candidates = [...this.pendingCandidates];
        this.pendingCandidates = [];
        for (const candidate of candidates) {
            try {
                await this.peerConnection?.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error('Error flushing buffered ice candidate', e);
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
