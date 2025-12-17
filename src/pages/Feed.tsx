import { useState, useRef, useEffect } from 'react';
import { VideoCard } from '@/components/video/VideoCard';
import { BottomNav } from '@/components/layout/BottomNav';
import { mockVideos } from '@/data/mockData';

export default function Feed() {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const videoHeight = window.innerHeight;
      const newIndex = Math.round(scrollTop / videoHeight);
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < mockVideos.length) {
        setActiveIndex(newIndex);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeIndex]);

  return (
    <div className="h-screen w-screen bg-surface-darker overflow-hidden">
      {/* Video Feed */}
      <div 
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
      >
        {mockVideos.map((video, index) => (
          <div 
            key={video.id} 
            className="h-screen w-full snap-start snap-always"
          >
            <VideoCard video={video} isActive={index === activeIndex} />
          </div>
        ))}
      </div>

      {/* Logo */}
      <div className="fixed top-4 left-4 z-30">
        <h1 className="text-2xl font-bold text-background drop-shadow-lg">donjo</h1>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
