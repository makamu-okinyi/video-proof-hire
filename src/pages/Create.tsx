import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, Video, Upload, RotateCcw, Play, 
  Check, ChevronDown, Globe, Users, SlidersHorizontal,
  Camera, AlertCircle, Loader2, Mic, MicOff, Volume2, VolumeX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { skillsList } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { useCamera } from '@/hooks/useCamera';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useVideoUpload } from '@/hooks/useVideoUpload';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Step = 'record' | 'preview' | 'details';
type Visibility = 'public' | 'recruiters';
type VideoSource = 'camera' | 'upload';

const contentCategories = [
  'Project Demo',
  'Technical Walkthrough', 
  'Design Process',
  'Case Study',
  'Skills Showcase',
  'Introduction',
];

const skillCategories = [
  { value: 'coding', label: 'Coding & Software', icon: '💻' },
  { value: 'electrical', label: 'Electrical', icon: '⚡' },
  { value: 'carpentry', label: 'Carpentry', icon: '🪚' },
  { value: 'plumbing', label: 'Plumbing', icon: '🔧' },
  { value: 'welding', label: 'Welding', icon: '🔥' },
  { value: 'design', label: 'Design & Creative', icon: '🎨' },
  { value: 'marketing', label: 'Marketing & Sales', icon: '📈' },
  { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
  { value: 'construction', label: 'Construction', icon: '🏗️' },
  { value: 'automotive', label: 'Automotive', icon: '🚗' },
  { value: 'culinary', label: 'Culinary & Food', icon: '👨‍🍳' },
  { value: 'other', label: 'Other', icon: '📦' },
];

export default function Create() {
  const navigate = useNavigate();
  const { user, isAuthenticated, profile, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>('record');
  const [videoSource, setVideoSource] = useState<VideoSource | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const [isPosting, setIsPosting] = useState(false);
  
  // Camera hook
  const {
    videoRef,
    isStreaming,
    isRecording,
    recordingTime,
    recordedUrl,
    recordedBlob,
    error: cameraError,
    isMicEnabled,
    startStream,
    stopStream,
    flipCamera,
    toggleMicrophone,
    startRecording,
    stopRecording,
    resetRecording,
  } = useCamera({ maxDuration: 120 });
  
  // Preview audio state
  const [isPreviewMuted, setIsPreviewMuted] = useState(false);

  // File upload hook
  const {
    inputRef: fileInputRef,
    handleFileChange,
    fileUrl: uploadedUrl,
    file: uploadedFile,
    error: uploadError,
    openFilePicker,
    clearFile,
  } = useFileUpload({ accept: 'video/*', maxSizeMB: 100 });

  // Video upload hook
  const { uploading, uploadVideo } = useVideoUpload();
  
  // Details
  const [caption, setCaption] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [contentCategory, setContentCategory] = useState('');
  const [skillCategory, setSkillCategory] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [showSkillPicker, setShowSkillPicker] = useState(false);
  const [showContentCategoryPicker, setShowContentCategoryPicker] = useState(false);
  const [showSkillCategoryPicker, setShowSkillCategoryPicker] = useState(false);

  // Redirect if not authenticated or if employer
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please log in to create videos');
      navigate('/');
    }
    // Redirect employers to create job page
    if (!authLoading && profile?.user_type === 'employer') {
      navigate('/employer/jobs/create', { replace: true });
    }
  }, [isAuthenticated, profile, authLoading, navigate]);

  // Start camera when component mounts
  useEffect(() => {
    if (step === 'record' && !uploadedUrl) {
      startStream();
    }
    return () => {
      if (step !== 'record') {
        stopStream();
      }
    };
  }, [step]);

  // Handle uploaded video - go to preview
  useEffect(() => {
    if (uploadedUrl) {
      setVideoSource('upload');
      stopStream();
      setStep('preview');
    }
  }, [uploadedUrl]);

  // Show errors
  useEffect(() => {
    if (cameraError) {
      toast.error(cameraError);
    }
    if (uploadError) {
      toast.error(uploadError);
    }
  }, [cameraError, uploadError]);

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(prev => prev.filter(s => s !== skill));
    } else if (selectedSkills.length < 5) {
      setSelectedSkills(prev => [...prev, skill]);
    }
  };

  const handleStartRecording = () => {
    startRecording();
  };

  const handleStopRecording = () => {
    stopRecording();
    setVideoSource('camera');
    setStep('preview');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRetake = () => {
    resetRecording();
    clearFile();
    setVideoSource(null);
    setStep('record');
    startStream();
  };

  const handlePost = async () => {
    if (!user) {
      toast.error('Please log in to post videos');
      return;
    }

    setIsPosting(true);
    try {
      // Get the video blob
      let videoBlob: Blob | null = null;
      
      if (videoSource === 'camera' && recordedBlob) {
        videoBlob = recordedBlob;
      } else if (videoSource === 'upload' && uploadedFile) {
        videoBlob = uploadedFile;
      }

      if (!videoBlob) {
        toast.error('No video to upload');
        return;
      }

      // Upload video to storage
      const videoUrl = await uploadVideo(videoBlob, user.id);
      
      if (!videoUrl) {
        toast.error('Failed to upload video');
        return;
      }

      // Save video record to database
      const { error } = await supabase.from('videos').insert({
        user_id: user.id,
        title: caption,
        description: caption,
        video_url: videoUrl,
        thumbnail_url: null, // Could generate thumbnail in future
        is_private: visibility === 'recruiters', // Recruiters-only videos are private
        skill_category: skillCategory || 'other',
      });

      if (error) {
        throw error;
      }

      toast.success('Video posted successfully!');
      navigate('/feed');
    } catch (error) {
      console.error('Error posting video:', error);
      toast.error('Failed to post video');
    } finally {
      setIsPosting(false);
    }
  };

  const currentVideoUrl = videoSource === 'upload' ? uploadedUrl : recordedUrl;

  const renderRecord = () => (
    <div className="h-screen bg-surface-darker flex flex-col">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Camera Preview Area */}
      <div className="flex-1 relative bg-surface-dark overflow-hidden">
        {/* Live camera feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "absolute inset-0 w-full h-full object-cover",
            !isStreaming && "hidden"
          )}
        />

        {/* Loading/Error state */}
        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface-darker">
            {cameraError ? (
              <div className="text-center space-y-4 px-6">
                <div className="h-16 w-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
                  <AlertCircle className="h-8 w-8 text-destructive" />
                </div>
                <p className="text-background/80 text-sm max-w-xs">{cameraError}</p>
                <Button variant="outline" size="sm" onClick={startStream}>
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-background/10 flex items-center justify-center mx-auto animate-pulse">
                  <Camera className="h-8 w-8 text-background/60" />
                </div>
                <p className="text-background/60 text-sm">Starting camera...</p>
              </div>
            )}
          </div>
        )}

        {/* Close Button */}
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-20 h-10 w-10 rounded-full bg-background/10 backdrop-blur-sm flex items-center justify-center"
        >
          <X className="h-5 w-5 text-background" />
        </button>

        {/* Timer */}
        {isRecording && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-destructive/90 backdrop-blur-sm">
            <span className="text-background font-mono font-medium">
              {formatTime(recordingTime)} / 2:00
            </span>
          </div>
        )}

        {/* Right side controls */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-3">
          {/* Flip Camera */}
          <button 
            onClick={flipCamera}
            className="h-10 w-10 rounded-full bg-background/10 backdrop-blur-sm flex items-center justify-center"
          >
            <RotateCcw className="h-5 w-5 text-background" />
          </button>
          
          {/* Microphone Toggle */}
          <button 
            onClick={toggleMicrophone}
            className={cn(
              "h-10 w-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-colors",
              isMicEnabled ? "bg-background/10" : "bg-destructive/80"
            )}
          >
            {isMicEnabled ? (
              <Mic className="h-5 w-5 text-background" />
            ) : (
              <MicOff className="h-5 w-5 text-background" />
            )}
          </button>
        </div>

        {/* Microphone status indicator */}
        {isRecording && (
          <div className={cn(
            "absolute bottom-4 right-4 z-20 px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-2",
            isMicEnabled ? "bg-green-500/80" : "bg-destructive/80"
          )}>
            {isMicEnabled ? (
              <>
                <Mic className="h-4 w-4 text-background" />
                <span className="text-background text-xs font-medium">Recording audio</span>
              </>
            ) : (
              <>
                <MicOff className="h-4 w-4 text-background" />
                <span className="text-background text-xs font-medium">Audio muted</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-surface-darker px-6 py-8 safe-area-pb">
        <div className="flex items-center justify-around">
          {/* Upload */}
          <button 
            onClick={openFilePicker}
            className="flex flex-col items-center gap-2"
          >
            <div className="h-12 w-12 rounded-xl bg-background/10 flex items-center justify-center">
              <Upload className="h-5 w-5 text-background" />
            </div>
            <span className="text-xs text-background/60">Upload</span>
          </button>

          {/* Record Button */}
          <button 
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={!isStreaming}
            className={cn(
              "h-20 w-20 rounded-full border-4 border-background flex items-center justify-center transition-all",
              isRecording ? "bg-destructive" : "bg-coral",
              !isStreaming && "opacity-50"
            )}
          >
            {isRecording ? (
              <div className="h-8 w-8 rounded-md bg-background" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-coral" />
            )}
          </button>

          {/* Effects */}
          <button className="flex flex-col items-center gap-2 opacity-50">
            <div className="h-12 w-12 rounded-xl bg-background/10 flex items-center justify-center">
              <SlidersHorizontal className="h-5 w-5 text-background" />
            </div>
            <span className="text-xs text-background/60">Effects</span>
          </button>
        </div>

        <p className="text-center text-background/40 text-xs mt-4">
          Record 60-120 seconds showcasing your skills
        </p>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="h-screen bg-surface-darker flex flex-col">
      {/* Video Preview */}
      <div className="flex-1 relative bg-surface-dark overflow-hidden">
        {/* Actual video playback */}
        {currentVideoUrl && (
          <video
            ref={previewVideoRef}
            src={currentVideoUrl}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            loop
            muted={isPreviewMuted}
            onClick={(e) => {
              const video = e.currentTarget;
              if (video.paused) {
                video.play();
              } else {
                video.pause();
              }
            }}
          />
        )}

        <button 
          onClick={handleRetake}
          className="absolute top-4 left-4 z-20 h-10 w-10 rounded-full bg-background/10 backdrop-blur-sm flex items-center justify-center"
        >
          <X className="h-5 w-5 text-background" />
        </button>

        {/* Volume Toggle */}
        <button 
          onClick={() => setIsPreviewMuted(prev => !prev)}
          className="absolute top-4 right-4 z-20 h-10 w-10 rounded-full bg-background/10 backdrop-blur-sm flex items-center justify-center"
        >
          {isPreviewMuted ? (
            <VolumeX className="h-5 w-5 text-background" />
          ) : (
            <Volume2 className="h-5 w-5 text-background" />
          )}
        </button>

        {/* Play Button Overlay (shown when paused) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-20 w-20 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Play className="h-10 w-10 text-background ml-1" fill="white" />
          </div>
        </div>

        {/* Duration & Audio indicator */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          <div className="px-3 py-1.5 rounded-full bg-background/10 backdrop-blur-sm">
            <span className="text-background text-sm font-mono">
              {videoSource === 'camera' ? formatTime(recordingTime) : 'Uploaded'}
            </span>
          </div>
          {!isPreviewMuted && (
            <div className="px-3 py-1.5 rounded-full bg-background/10 backdrop-blur-sm flex items-center gap-1.5">
              <Volume2 className="h-3.5 w-3.5 text-background" />
              <span className="text-background text-xs">Audio on</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-surface-darker px-6 py-6 safe-area-pb">
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="lg"
            className="flex-1 border-background/20 text-background hover:bg-background/10"
            onClick={handleRetake}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Retake
          </Button>
          <Button 
            variant="coral" 
            size="lg"
            className="flex-1"
            onClick={() => setStep('details')}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );

  const renderDetails = () => (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setStep('preview')}>
            <X className="h-6 w-6" />
          </button>
          <h1 className="font-semibold">Post Video</h1>
          <Button 
            variant="coral" 
            size="sm"
            onClick={handlePost}
            disabled={!caption || isPosting || uploading}
          >
            {isPosting || uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              'Post'
            )}
          </Button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Video Thumbnail */}
        <div className="flex gap-4">
          <div className="w-24 h-36 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
            <Video className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <Input
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="h-auto min-h-[100px] py-3 resize-none"
            />
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-3">
          <button 
            onClick={() => setShowSkillPicker(!showSkillPicker)}
            className="w-full flex items-center justify-between py-3 border-b border-border"
          >
            <span className="font-medium">Skills</span>
            <div className="flex items-center gap-2">
              {selectedSkills.length > 0 ? (
                <span className="text-sm text-muted-foreground">{selectedSkills.length} selected</span>
              ) : (
                <span className="text-sm text-muted-foreground">Add skills</span>
              )}
              <ChevronDown className={cn("h-4 w-4 transition-transform", showSkillPicker && "rotate-180")} />
            </div>
          </button>
          
          {showSkillPicker && (
            <div className="flex flex-wrap gap-2 py-2 animate-fade-in">
              {skillsList.map((skill) => (
                <Badge
                  key={skill}
                  variant={selectedSkills.includes(skill) ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => toggleSkill(skill)}
                >
                  {skill}
                  {selectedSkills.includes(skill) && <Check className="h-3 w-3 ml-1" />}
                </Badge>
              ))}
            </div>
          )}
          
          {selectedSkills.length > 0 && !showSkillPicker && (
            <div className="flex flex-wrap gap-2">
              {selectedSkills.map((skill) => (
                <Badge key={skill} variant="default">
                  {skill}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Skill Category (Trade/Profession) */}
        <div className="space-y-3">
          <button 
            onClick={() => setShowSkillCategoryPicker(!showSkillCategoryPicker)}
            className="w-full flex items-center justify-between py-3 border-b border-border"
          >
            <span className="font-medium">Trade / Profession</span>
            <div className="flex items-center gap-2">
              {skillCategory ? (
                <span className="text-sm">
                  {skillCategories.find(c => c.value === skillCategory)?.icon}{' '}
                  {skillCategories.find(c => c.value === skillCategory)?.label}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">Select your field</span>
              )}
              <ChevronDown className={cn("h-4 w-4 transition-transform", showSkillCategoryPicker && "rotate-180")} />
            </div>
          </button>
          
          {showSkillCategoryPicker && (
            <div className="grid grid-cols-2 gap-2 animate-fade-in">
              {skillCategories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => { setSkillCategory(cat.value); setShowSkillCategoryPicker(false); }}
                  className={cn(
                    "text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-2",
                    skillCategory === cat.value ? "bg-coral/10 text-coral border border-coral" : "bg-secondary hover:bg-secondary/80"
                  )}
                >
                  <span className="text-lg">{cat.icon}</span>
                  <span className="text-sm font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Category */}
        <div className="space-y-3">
          <button 
            onClick={() => setShowContentCategoryPicker(!showContentCategoryPicker)}
            className="w-full flex items-center justify-between py-3 border-b border-border"
          >
            <span className="font-medium">Content Type</span>
            <div className="flex items-center gap-2">
              {contentCategory ? (
                <span className="text-sm">{contentCategory}</span>
              ) : (
                <span className="text-sm text-muted-foreground">Select type</span>
              )}
              <ChevronDown className={cn("h-4 w-4 transition-transform", showContentCategoryPicker && "rotate-180")} />
            </div>
          </button>
          
          {showContentCategoryPicker && (
            <div className="space-y-1 animate-fade-in">
              {contentCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setContentCategory(cat); setShowContentCategoryPicker(false); }}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl transition-colors",
                    contentCategory === cat ? "bg-coral/10 text-coral" : "hover:bg-secondary"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Visibility */}
        <div className="space-y-3">
          <span className="font-medium">Visibility</span>
          <div className="flex gap-3">
            <button
              onClick={() => setVisibility('public')}
              className={cn(
                "flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                visibility === 'public' ? "border-coral bg-coral/5" : "border-border"
              )}
            >
              <Globe className={cn("h-5 w-5", visibility === 'public' ? "text-coral" : "text-muted-foreground")} />
              <div className="text-left">
                <p className="font-medium text-sm">Public</p>
                <p className="text-xs text-muted-foreground">Anyone can see</p>
              </div>
            </button>
            <button
              onClick={() => setVisibility('recruiters')}
              className={cn(
                "flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                visibility === 'recruiters' ? "border-coral bg-coral/5" : "border-border"
              )}
            >
              <Users className={cn("h-5 w-5", visibility === 'recruiters' ? "text-coral" : "text-muted-foreground")} />
              <div className="text-left">
                <p className="font-medium text-sm">Recruiters</p>
                <p className="text-xs text-muted-foreground">Employers only</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {step === 'record' && renderRecord()}
      {step === 'preview' && renderPreview()}
      {step === 'details' && renderDetails()}
    </>
  );
}
