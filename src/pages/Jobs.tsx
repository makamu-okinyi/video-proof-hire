import { useState } from 'react';
import { Search, SlidersHorizontal, MapPin, Briefcase, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { JobCard } from '@/components/jobs/JobCard';
import { BottomNav } from '@/components/layout/BottomNav';
import { mockJobs, skillsList } from '@/data/mockData';
import { cn } from '@/lib/utils';

type LocationType = 'all' | 'remote' | 'hybrid' | 'onsite';
type ExperienceLevel = 'all' | 'entry' | 'mid' | 'senior';

export default function Jobs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [locationType, setLocationType] = useState<LocationType>('all');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('all');

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const filteredJobs = mockJobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = locationType === 'all' || job.locationType === locationType;
    const matchesExperience = experienceLevel === 'all' || job.experienceLevel === experienceLevel;
    const matchesSkills = selectedSkills.length === 0 || 
                         selectedSkills.some(skill => job.skills.includes(skill));
    return matchesSearch && matchesLocation && matchesExperience && matchesSkills;
  });

  const clearFilters = () => {
    setSelectedSkills([]);
    setLocationType('all');
    setExperienceLevel('all');
  };

  const hasActiveFilters = selectedSkills.length > 0 || locationType !== 'all' || experienceLevel !== 'all';

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Jobs</h1>
          <Button 
            variant={showFilters ? "default" : "outline"} 
            size="icon-sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(hasActiveFilters && !showFilters && "border-coral text-coral")}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs, companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* Active Filters Preview */}
        {hasActiveFilters && !showFilters && (
          <div className="flex items-center gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
            {locationType !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
                <MapPin className="h-3 w-3" />
                {locationType}
                <button onClick={() => setLocationType('all')}>
                  <X className="h-3 w-3 ml-1" />
                </button>
              </Badge>
            )}
            {experienceLevel !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1 shrink-0">
                <Briefcase className="h-3 w-3" />
                {experienceLevel}
                <button onClick={() => setExperienceLevel('all')}>
                  <X className="h-3 w-3 ml-1" />
                </button>
              </Badge>
            )}
            {selectedSkills.map(skill => (
              <Badge key={skill} variant="secondary" className="flex items-center gap-1 shrink-0">
                {skill}
                <button onClick={() => toggleSkill(skill)}>
                  <X className="h-3 w-3 ml-1" />
                </button>
              </Badge>
            ))}
            <button 
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-foreground shrink-0"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-card border-b border-border px-4 py-4 space-y-5 animate-slide-down">
          {/* Location Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location Type
            </label>
            <div className="flex flex-wrap gap-2">
              {(['all', 'remote', 'hybrid', 'onsite'] as LocationType[]).map((type) => (
                <Button
                  key={type}
                  variant={locationType === type ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setLocationType(type)}
                  className="capitalize"
                >
                  {type === 'all' ? 'All' : type}
                </Button>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Experience Level
            </label>
            <div className="flex flex-wrap gap-2">
              {(['all', 'entry', 'mid', 'senior'] as ExperienceLevel[]).map((level) => (
                <Button
                  key={level}
                  variant={experienceLevel === level ? "default" : "secondary"}
                  size="sm"
                  onClick={() => setExperienceLevel(level)}
                  className="capitalize"
                >
                  {level === 'all' ? 'All Levels' : level}
                </Button>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Skills</label>
            <div className="flex flex-wrap gap-2">
              {skillsList.slice(0, 10).map((skill) => (
                <Button
                  key={skill}
                  variant={selectedSkills.includes(skill) ? "default" : "secondary"}
                  size="sm"
                  onClick={() => toggleSkill(skill)}
                >
                  {skill}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button variant="ghost" onClick={clearFilters} className="flex-1">
              Clear All
            </Button>
            <Button variant="hero" onClick={() => setShowFilters(false)} className="flex-1">
              Apply Filters
            </Button>
          </div>
        </div>
      )}

      {/* Job List */}
      <div className="px-4 py-4 space-y-3">
        <p className="text-sm text-muted-foreground">
          {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
        </p>
        
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No jobs match your criteria</p>
            <Button variant="link" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
