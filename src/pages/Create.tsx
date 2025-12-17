import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, Video, Upload, RotateCcw, Pause, Play, 
  Check, ChevronDown, Globe, Users, Sparkles 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { skillsList } from '@/data/mockData';
import { cn } from '@/lib/utils';

type Step = 'record' | 'preview' | 'details';
type Visibility = 'public' | 'recruiters';

const categories = [
  'Project Demo',
  'Technical Walkthrough', 
  'Design Process',
  'Case Study',
  'Skills Showcase',
  'Introduction',
];

export default function Create() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('record');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecording, setHasRecording] = useState(false);
  
  // Details
  const [caption, setCaption] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [showSkillPicker, setShowSkillPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(prev => prev.filter(s => s !== skill));
    } else if (selectedSkills.length < 5) {
      setSelectedSkills(prev => [...prev, skill]);
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    // Simulate recording timer
    const interval = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= 120) {
          clearInterval(interval);
          setIsRecording(false);
          setHasRecording(true);
          return 120;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setHasRecording(true);
    setStep('preview');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePost = () => {
    // In production, this would upload the video
    navigate('/feed');
  };

  const renderRecord = () => (
    <div className="h-screen bg-surface-darker flex flex-col">
      {/* Camera Preview Area */}
      <div className="flex-1 relative bg-gradient-to-b from-surface-dark to-surface-darker flex items-center justify-center">
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

        {/* Flip Camera */}
        <button className="absolute top-4 right-4 z-20 h-10 w-10 rounded-full bg-background/10 backdrop-blur-sm flex items-center justify-center">
          <RotateCcw className="h-5 w-5 text-background" />
        </button>

        {/* Camera Placeholder */}
        <div className="text-center space-y-4">
          <div className="h-24 w-24 rounded-full bg-background/10 backdrop-blur-sm flex items-center justify-center mx-auto">
            <Video className="h-12 w-12 text-background/60" />
          </div>
          <p className="text-background/60 text-sm">Camera preview will appear here</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-surface-darker px-6 py-8 safe-area-pb">
        <div className="flex items-center justify-around">
          {/* Upload */}
          <button className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-xl bg-background/10 flex items-center justify-center">
              <Upload className="h-5 w-5 text-background" />
            </div>
            <span className="text-xs text-background/60">Upload</span>
          </button>

          {/* Record Button */}
          <button 
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className={cn(
              "h-20 w-20 rounded-full border-4 border-background flex items-center justify-center transition-all",
              isRecording ? "bg-destructive" : "bg-coral"
            )}
          >
            {isRecording ? (
              <div className="h-8 w-8 rounded-md bg-background" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-coral" />
            )}
          </button>

          {/* Effects */}
          <button className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-xl bg-background/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-background" />
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
      <div className="flex-1 relative bg-gradient-to-b from-surface-dark to-surface-darker">
        <button 
          onClick={() => { setStep('record'); setHasRecording(false); setRecordingTime(0); }}
          className="absolute top-4 left-4 z-20 h-10 w-10 rounded-full bg-background/10 backdrop-blur-sm flex items-center justify-center"
        >
          <X className="h-5 w-5 text-background" />
        </button>

        {/* Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button className="h-20 w-20 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="h-10 w-10 text-background ml-1" fill="white" />
          </button>
        </div>

        {/* Duration */}
        <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-background/10 backdrop-blur-sm">
          <span className="text-background text-sm font-mono">{formatTime(recordingTime)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-surface-darker px-6 py-6 safe-area-pb">
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="lg"
            className="flex-1 border-background/20 text-background hover:bg-background/10"
            onClick={() => { setStep('record'); setHasRecording(false); setRecordingTime(0); }}
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
            disabled={!caption}
          >
            Post
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

        {/* Category */}
        <div className="space-y-3">
          <button 
            onClick={() => setShowCategoryPicker(!showCategoryPicker)}
            className="w-full flex items-center justify-between py-3 border-b border-border"
          >
            <span className="font-medium">Category</span>
            <div className="flex items-center gap-2">
              {category ? (
                <span className="text-sm">{category}</span>
              ) : (
                <span className="text-sm text-muted-foreground">Select category</span>
              )}
              <ChevronDown className={cn("h-4 w-4 transition-transform", showCategoryPicker && "rotate-180")} />
            </div>
          </button>
          
          {showCategoryPicker && (
            <div className="space-y-1 animate-fade-in">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat); setShowCategoryPicker(false); }}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-xl transition-colors",
                    category === cat ? "bg-coral/10 text-coral" : "hover:bg-secondary"
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
