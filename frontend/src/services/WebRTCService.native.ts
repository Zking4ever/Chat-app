import {
    RTCPeerConnection,
    RTCIceCandidate,
    RTCSessionDescription,
    mediaDevices
} from 'react-native-webrtc';

export class WebRTCService {
    private peerConnection: any = null;
    private localStream: any = null;
    private remoteStream: any = null;
    private onRemoteStreamCallback: ((stream: any) => void) | null = null;
    private onIceCandidateCallback: ((candidate: any) => void) | null = null;
    private onConnectionStateCallback: ((state: string) => void) | null = null;

    // Buffer ICE candidates that arrive before remote description is set
    private pendingCandidates: any[] = [];
    private isRemoteDescriptionSet = false;

    private config: any = {
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
        this.peerConnection = new RTCPeerConnection(this.config);
        this.setupListeners();
        console.log('Native RTCPeerConnection initialized');
    }

    private setupListeners() {
        if (!this.peerConnection) return;

        this.peerConnection.onicecandidate = (event: any) => {
            if (event.candidate && this.onIceCandidateCallback) {
                this.onIceCandidateCallback(event.candidate);
            }
        };

        this.peerConnection.onaddstream = (event: any) => {
            console.log('Native OnAddStream event:', event.stream);
            if (event.stream) {
                this.remoteStream = event.stream;
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
            this.localStream = await mediaDevices.getUserMedia({
                audio: true,
                video: video ? {
                    facingMode: 'user',
                    width: 640,
                    height: 480,
                    frameRate: 30
                } : false
            });

            if (this.localStream && this.peerConnection) {
                // Only add stream if it hasn't already been added
                const existingStreams = this.peerConnection.getLocalStreams
                    ? this.peerConnection.getLocalStreams()
                    : [];
                const alreadyAdded = existingStreams.some(
                    (s: any) => s.id === this.localStream.id
                );
                if (!alreadyAdded) {
                    this.peerConnection.addStream(this.localStream);
                }
                return this.localStream;
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

    async handleOffer(offer: any) {
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

    async handleAnswer(answer: any) {
        if (!this.peerConnection) return;
        try {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            this.isRemoteDescriptionSet = true;
            await this.flushPendingCandidates();
        } catch (error) {
            console.error('Error handling answer:', error);
        }
    }

    async addIceCandidate(candidate: any) {
        if (!this.peerConnection) return;
        try {
            if (!this.isRemoteDescriptionSet) {
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
            this.localStream.getAudioTracks().forEach((track: any) => {
                track.enabled = enabled;
            });
        }
    }

    toggleVideo(enabled: boolean) {
        if (this.localStream) {
            this.localStream.getVideoTracks().forEach((track: any) => {
                track.enabled = enabled;
            });
        }
    }

    onRemoteStream(callback: (stream: any) => void) {
        this.onRemoteStreamCallback = callback;
        if (this.remoteStream) {
            callback(this.remoteStream);
        }
    }

    onIceCandidate(callback: (candidate: any) => void) {
        this.onIceCandidateCallback = callback;
    }

    onConnectionState(callback: (state: string) => void) {
        this.onConnectionStateCallback = callback;
    }

    close() {
        if (this.localStream) {
            this.localStream.getTracks().forEach((track: any) => track.stop());
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
