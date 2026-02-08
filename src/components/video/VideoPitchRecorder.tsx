import { useState, useRef, useCallback, useEffect } from 'react';
import { Video, Upload, Square, Circle, Clock, AlertCircle, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VideoPitchRecorderProps {
  onVideoReady: (blob: Blob, url: string) => void;
  onCancel?: () => void;
  maxDuration?: number; // in seconds, default 60
}

export function VideoPitchRecorder({ 
  onVideoReady, 
  onCancel,
  maxDuration = 60 
}: VideoPitchRecorderProps) {
  const [mode, setMode] = useState<'select' | 'record' | 'upload' | 'preview'>('select');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedTime, setRecordedTime] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [stream, previewUrl]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
        audio: true
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setMode('record');
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Could not access camera. Please check permissions.');
    }
  };

  const startRecording = () => {
    if (!stream) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
        ? 'video/webm;codecs=vp9' 
        : 'video/webm'
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordedBlob(blob);
      setPreviewUrl(url);
      setMode('preview');
      
      // Stop camera stream
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    };

    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
    setRecordedTime(0);

    // Timer
    timerRef.current = setInterval(() => {
      setRecordedTime(prev => {
        if (prev >= maxDuration - 1) {
          stopRecording();
          return maxDuration;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsRecording(false);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video file must be under 100MB');
      return;
    }

    // Create video element to check duration
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      if (video.duration > maxDuration) {
        toast.error(`Video must be ${maxDuration} seconds or less`);
        return;
      }
      
      const url = URL.createObjectURL(file);
      setRecordedBlob(file);
      setPreviewUrl(url);
      setMode('preview');
    };

    video.src = URL.createObjectURL(file);
  };

  const handleConfirm = () => {
    if (recordedBlob && previewUrl) {
      onVideoReady(recordedBlob, previewUrl);
    }
  };

  const resetRecorder = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setRecordedBlob(null);
    setRecordedTime(0);
    setMode('select');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Selection Mode */}
      {mode === 'select' && (
        <div className="space-y-4">
          <div className="text-center space-y-2 mb-6">
            <h3 className="text-lg font-semibold text-white">The 1-Minute Pitch</h3>
            <p className="text-sm text-white/60">
              Record a {maxDuration}-second video pitch or upload an existing one
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={startCamera}
              className="flex flex-col items-center gap-3 p-6 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl transition-all duration-300"
            >
              <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
                <Video className="h-7 w-7 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium text-white">Record Now</p>
                <p className="text-xs text-white/50">Use your webcam</p>
              </div>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-3 p-6 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl transition-all duration-300"
            >
              <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center">
                <Upload className="h-7 w-7 text-white" />
              </div>
              <div className="text-center">
                <p className="font-medium text-white">Upload Video</p>
                <p className="text-xs text-white/50">Max {maxDuration}s, 100MB</p>
              </div>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <div className="flex items-center gap-2 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
            <p className="text-xs text-yellow-200">
              Keep it under {maxDuration} seconds. Focus on: Problem → Solution → Traction → Ask
            </p>
          </div>
        </div>
      )}

      {/* Recording Mode */}
      {mode === 'record' && (
        <div className="space-y-4">
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Timer overlay */}
            <div className={cn(
              "absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full",
              isRecording ? "bg-red-500" : "bg-black/50"
            )}>
              {isRecording && <Circle className="h-3 w-3 fill-white animate-pulse" />}
              <Clock className="h-4 w-4 text-white" />
              <span className="text-sm font-mono text-white">
                {formatTime(recordedTime)} / {formatTime(maxDuration)}
              </span>
            </div>

            {/* Progress bar */}
            {isRecording && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                <div 
                  className="h-full bg-primary transition-all duration-1000"
                  style={{ width: `${(recordedTime / maxDuration) * 100}%` }}
                />
              </div>
            )}
          </div>

          <div className="flex justify-center gap-4">
            {!isRecording ? (
              <>
                <Button
                  variant="outline"
                  onClick={resetRecorder}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Cancel
                </Button>
                <Button
                  onClick={startRecording}
                  className="bg-red-500 hover:bg-red-600 text-white gap-2"
                >
                  <Circle className="h-4 w-4 fill-current" />
                  Start Recording
                </Button>
              </>
            ) : (
              <Button
                onClick={stopRecording}
                variant="destructive"
                className="gap-2"
              >
                <Square className="h-4 w-4 fill-current" />
                Stop Recording
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Preview Mode */}
      {mode === 'preview' && previewUrl && (
        <div className="space-y-4">
          <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
            <video
              src={previewUrl}
              controls
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={resetRecorder}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 gap-2"
            >
              <X className="h-4 w-4" />
              Re-record
            </Button>
            <Button
              onClick={handleConfirm}
              className="bg-primary hover:bg-primary/90 text-white gap-2"
            >
              <Check className="h-4 w-4" />
              Use This Video
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
