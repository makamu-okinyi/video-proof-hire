import { useState, useEffect, useRef } from 'react';
import { Video, Upload, RotateCcw, Camera, Mic, MicOff, AlertCircle, Loader2, X, Play, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCamera } from '@/hooks/useCamera';
import { useFileUpload } from '@/hooks/useFileUpload';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VideoPitchRecorderProps {
  onVideoReady: (blob: Blob) => void;
  maxDuration?: number;
}

function QualityBadge({ quality }: { quality: string | null }) {
  if (!quality) return null;
  const isHD = quality === '1080p' || quality === '720p';
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider",
      isHD
        ? "bg-emerald-500/20 text-emerald-400"
        : "bg-amber-500/20 text-amber-400"
    )}>
      {isHD && <Sparkles className="h-3 w-3" />}
      {quality === '1080p' ? 'HD 1080p' : quality === '720p' ? 'HD 720p' : 'SD'}
    </span>
  );
}

export function VideoPitchRecorder({ onVideoReady, maxDuration = 60 }: VideoPitchRecorderProps) {
  const [mode, setMode] = useState<'choose' | 'camera' | 'preview'>('choose');
  const previewRef = useRef<HTMLVideoElement>(null);

  const {
    videoRef, isStreaming, isRecording, recordingTime, recordedUrl, recordedBlob,
    error: cameraError, isMicEnabled, streamQuality, startStream, stopStream, flipCamera,
    toggleMicrophone, startRecording, stopRecording, resetRecording,
  } = useCamera({ maxDuration });

  const {
    inputRef: fileInputRef, handleFileChange, fileUrl: uploadedUrl,
    file: uploadedFile, error: uploadError, openFilePicker, clearFile,
  } = useFileUpload({ accept: 'video/*', maxSizeMB: 25 });

  useEffect(() => {
    if (uploadedUrl && uploadedFile) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        if (video.duration > maxDuration) {
          toast.error(`Video must be ${maxDuration} seconds or less. Yours is ${Math.ceil(video.duration)}s.`);
          clearFile();
        } else {
          setMode('preview');
        }
        URL.revokeObjectURL(video.src);
      };
      video.src = URL.createObjectURL(uploadedFile);
    }
  }, [uploadedUrl, uploadedFile, maxDuration]);

  useEffect(() => {
    if (cameraError) toast.error(cameraError);
    if (uploadError) toast.error(uploadError);
  }, [cameraError, uploadError]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const handleStartCamera = async () => {
    setMode('camera');
    await startStream();
  };

  const handleStopRecording = () => {
    stopRecording();
    setMode('preview');
  };

  const handleRetake = () => {
    resetRecording();
    clearFile();
    setMode('choose');
  };

  const handleConfirm = () => {
    const blob = recordedBlob || uploadedFile;
    if (blob) onVideoReady(blob);
  };

  const currentUrl = recordedUrl || uploadedUrl;

  if (mode === 'choose') {
    return (
      <div className="space-y-4">
        <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileChange} className="hidden" />
        <p className="text-sm text-cool-grey text-center">Record or upload a {maxDuration}-second pitch video</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button onClick={handleStartCamera} className="neo-extruded rounded-2xl p-6 text-center hover:shadow-neo-pressed transition-all duration-300">
            <Camera className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="font-medium text-charcoal text-sm">Record Now</p>
            <p className="text-xs text-cool-grey mt-1">HD quality · up to {maxDuration}s</p>
          </button>
          <button onClick={openFilePicker} className="neo-extruded rounded-2xl p-6 text-center hover:shadow-neo-pressed transition-all duration-300">
            <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="font-medium text-charcoal text-sm">Upload Video</p>
            <p className="text-xs text-cool-grey mt-1">Max {maxDuration}s, 25MB</p>
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'camera') {
    return (
      <div className="space-y-3">
        <div className="relative aspect-video max-h-[50vh] bg-black rounded-2xl overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className={cn("w-full h-full object-cover", !isStreaming && "hidden")} />
          {!isStreaming && (
            <div className="absolute inset-0 flex items-center justify-center">
              {cameraError ? (
                <div className="text-center px-4">
                  <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-2" />
                  <p className="text-white/80 text-sm">{cameraError}</p>
                  <Button size="sm" variant="outline" onClick={startStream} className="mt-3">Retry</Button>
                </div>
              ) : (
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              )}
            </div>
          )}

          {/* Quality badge + timer */}
          <div className="absolute top-3 left-3">
            <QualityBadge quality={streamQuality} />
          </div>

          {isRecording && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-red-600 text-white text-sm font-mono">
              {formatTime(recordingTime)} / {formatTime(maxDuration)}
            </div>
          )}

          {/* Controls overlay */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            <button onClick={flipCamera} className="h-9 w-9 rounded-full bg-black/40 flex items-center justify-center">
              <RotateCcw className="h-4 w-4 text-white" />
            </button>
            <button onClick={toggleMicrophone} className={cn("h-9 w-9 rounded-full flex items-center justify-center", isMicEnabled ? "bg-black/40" : "bg-red-600")}>
              {isMicEnabled ? <Mic className="h-4 w-4 text-white" /> : <MicOff className="h-4 w-4 text-white" />}
            </button>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <Button variant="outline" onClick={handleRetake} className="neo-extruded border-none">Cancel</Button>
          <button
            onClick={isRecording ? handleStopRecording : startRecording}
            disabled={!isStreaming}
            className={cn(
              "h-16 w-16 rounded-full border-4 border-charcoal flex items-center justify-center transition-all",
              isRecording ? "bg-red-600" : "bg-primary",
              !isStreaming && "opacity-50"
            )}
          >
            {isRecording ? <div className="h-6 w-6 rounded-sm bg-white" /> : <div className="h-12 w-12 rounded-full bg-primary" />}
          </button>
          <div className="w-[72px]" />
        </div>
        <p className="text-center text-cool-grey text-xs">Max {maxDuration} seconds</p>
      </div>
    );
  }

  // Preview mode
  return (
    <div className="space-y-3">
      <div className="relative aspect-video max-h-[50vh] bg-black rounded-2xl overflow-hidden">
        {currentUrl && (
          <video ref={previewRef} src={currentUrl} controls playsInline className="w-full h-full object-contain" />
        )}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 neo-extruded border-none" onClick={handleRetake}>
          <RotateCcw className="h-4 w-4 mr-2" /> Retake
        </Button>
        <Button className="flex-1" onClick={handleConfirm}>
          <Check className="h-4 w-4 mr-2" /> Use This Video
        </Button>
      </div>
    </div>
  );
}
