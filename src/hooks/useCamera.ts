import { useState, useRef, useCallback, useEffect } from 'react';

interface UseCameraOptions {
  maxDuration?: number;
}

type StreamQuality = '1080p' | '720p' | 'fallback';

function getSupportedMimeType(): string {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp8',
    'video/mp4;codecs=h264,aac',
    'video/mp4;codecs=h264',
    'video/webm',
  ];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return '';
}

function buildAudioProcessedStream(
  original: MediaStream
): { stream: MediaStream; cleanup: () => void } {
  const audioTracks = original.getAudioTracks();
  if (!audioTracks.length) return { stream: original, cleanup: () => {} };

  try {
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(original);

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-24, ctx.currentTime);
    compressor.knee.setValueAtTime(12, ctx.currentTime);
    compressor.ratio.setValueAtTime(4, ctx.currentTime);
    compressor.attack.setValueAtTime(0.003, ctx.currentTime);
    compressor.release.setValueAtTime(0.25, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(1.4, ctx.currentTime);

    source.connect(compressor);
    compressor.connect(gain);

    const dest = ctx.createMediaStreamDestination();
    gain.connect(dest);

    const processedStream = new MediaStream();
    original.getVideoTracks().forEach(t => processedStream.addTrack(t));
    dest.stream.getAudioTracks().forEach(t => processedStream.addTrack(t));

    return {
      stream: processedStream,
      cleanup: () => {
        source.disconnect();
        compressor.disconnect();
        gain.disconnect();
        ctx.close().catch(() => {});
      },
    };
  } catch {
    return { stream: original, cleanup: () => {} };
  }
}

const RESOLUTION_TIERS: Array<{
  label: StreamQuality;
  video: MediaTrackConstraints;
}> = [
  {
    label: '1080p',
    video: {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30, min: 24 },
      aspectRatio: 1.777778,
    },
  },
  {
    label: '720p',
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30, min: 24 },
      aspectRatio: 1.777778,
    },
  },
  {
    label: 'fallback',
    video: {
      frameRate: { ideal: 30 },
    },
  },
];

export function useCamera({ maxDuration = 120 }: UseCameraOptions = {}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCleanupRef = useRef<(() => void) | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [streamQuality, setStreamQuality] = useState<StreamQuality | null>(null);

  const startStream = useCallback(async () => {
    try {
      setError(null);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (audioCleanupRef.current) {
        audioCleanupRef.current();
        audioCleanupRef.current = null;
      }

      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      };

      let stream: MediaStream | null = null;
      let quality: StreamQuality = 'fallback';

      for (const tier of RESOLUTION_TIERS) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { ...tier.video, facingMode },
            audio: audioConstraints,
          });
          quality = tier.label;
          break;
        } catch {
          continue;
        }
      }

      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: audioConstraints,
        });
        quality = 'fallback';
      }

      streamRef.current = stream;
      setStreamQuality(quality);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsStreaming(true);
    } catch (err) {
      console.error('Camera/Microphone error:', err);
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Camera and microphone permission denied. Please allow access in your browser settings.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera or microphone found on this device.');
        } else if (err.name === 'NotReadableError') {
          setError('Camera or microphone is already in use by another application.');
        } else if (err.name === 'OverconstrainedError') {
          setError('Camera does not support the requested settings.');
        } else {
          setError('Failed to access camera and microphone. Please try again.');
        }
      }
    }
  }, [facingMode]);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioCleanupRef.current) {
      audioCleanupRef.current();
      audioCleanupRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setStreamQuality(null);
  }, []);

  const flipCamera = useCallback(async () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  const toggleMicrophone = useCallback(() => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(t => { t.enabled = !t.enabled; });
      setIsMicEnabled(prev => !prev);
    }
  }, []);

  useEffect(() => {
    if (isStreaming) {
      startStream();
    }
  }, [facingMode]);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    setRecordingTime(0);
    setRecordedBlob(null);
    setRecordedUrl(null);

    const { stream: processedStream, cleanup } = buildAudioProcessedStream(streamRef.current);
    audioCleanupRef.current = cleanup;

    const mimeType = getSupportedMimeType();

    const bitrate = streamQuality === '1080p' ? 8_000_000 : streamQuality === '720p' ? 5_000_000 : 2_500_000;

    const options: MediaRecorderOptions = {
      videoBitsPerSecond: bitrate,
      ...(mimeType ? { mimeType } : {}),
    };

    const mediaRecorder = new MediaRecorder(processedStream, options);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const finalMime = mediaRecorder.mimeType || mimeType || 'video/webm';
      const blob = new Blob(chunksRef.current, { type: finalMime });
      setRecordedBlob(blob);
      setRecordedUrl(URL.createObjectURL(blob));
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(1000);
    setIsRecording(true);

    timerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= maxDuration) {
          stopRecording();
          return maxDuration;
        }
        return prev + 1;
      });
    }, 1000);
  }, [maxDuration, streamQuality]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const resetRecording = useCallback(() => {
    setRecordedBlob(null);
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedUrl(null);
    setRecordingTime(0);
    chunksRef.current = [];
  }, [recordedUrl]);

  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
    };
  }, []);

  return {
    videoRef,
    isStreaming,
    isRecording,
    recordingTime,
    recordedBlob,
    recordedUrl,
    error,
    facingMode,
    isMicEnabled,
    streamQuality,
    startStream,
    stopStream,
    flipCamera,
    toggleMicrophone,
    startRecording,
    stopRecording,
    resetRecording,
  };
}
