'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './VideoRecorder.module.css';

interface VideoRecorderProps {
  onUpload?: (data: {
    fileName: string;
    recordedAt: string;
    fileType: string;
    downloadUrl: string;
  }) => Promise<void>;
}

export const VideoRecorder: React.FC<VideoRecorderProps> = ({ onUpload }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'playback'>('idle');
  const [error, setError] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const chunks = useRef<Blob[]>([]);

  const constraints = {
    audio: true,
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 }
    }
  };

  const recorderOptions = {
    mimeType: 'video/webm;codecs=vp8,opus',
    videoBitsPerSecond: 2500000
  };

  useEffect(() => {
    initializeMedia();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initializeMedia = async () => {
    try {
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        throw new Error('Your browser does not support video recording');
      }

      if (!MediaRecorder.isTypeSupported(recorderOptions.mimeType)) {
        throw new Error('WebM format is not supported in this browser');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.muted = true;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize media');
      console.error('Media initialization failed:', err);
    }
  };

  const startRecording = () => {
    if (!stream) return;
    
    chunks.current = [];
    const recorder = new MediaRecorder(stream, recorderOptions);
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.current.push(e.data);
      }
    };

    recorder.onstop = handleRecordingStop;
    
    recorder.start(1000);
    setMediaRecorder(recorder);
    setRecordingState('recording');
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
  };

  const handleRecordingStop = () => {
    const recording = new Blob(chunks.current, { type: 'video/webm' });
    const url = URL.createObjectURL(recording);
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = url;
      videoRef.current.muted = false;
    }
    
    setDownloadUrl(url);
    setRecordingState('playback');

    const fileName = `recording_${Date.now()}.webm`;
    
    if (onUpload) {
      onUpload({
        fileName,
        recordedAt: new Date().toISOString(),
        fileType: 'video/webm',
        downloadUrl: url.replace('blob:', '')
      });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.videoContainer}>
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          className={styles.video}
        />
        <div className={styles.controls}>
          <button
            onClick={startRecording}
            disabled={recordingState === 'recording'}
            className={styles.button}
          >
            Record
          </button>
          <button
            onClick={stopRecording}
            disabled={recordingState !== 'recording'}
            className={styles.button}
          >
            Stop
          </button>
        </div>
        {downloadUrl && recordingState === 'playback' && (
          <a
            href={downloadUrl}
            download={`recording_${Date.now()}.webm`}
            className={styles.downloadLink}
          >
            Download Recording
          </a>
        )}
        {error && <div className={styles.error}>{error}</div>}
      </div>
    </div>
  );
};
