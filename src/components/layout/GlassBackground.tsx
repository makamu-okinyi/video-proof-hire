import bgAbstract1 from '@/assets/bg-abstract-1.jpeg';
import bgAbstract2 from '@/assets/bg-abstract-2.jpeg';
import bgAbstract3 from '@/assets/bg-abstract-3.jpeg';

interface GlassBackgroundProps {
  variant?: 'earth' | 'burgundy' | 'neutral';
}

const backgrounds = {
  earth: bgAbstract1,
  burgundy: bgAbstract2,
  neutral: bgAbstract3,
};

export function GlassBackground({ variant = 'earth' }: GlassBackgroundProps) {
  const bgImage = backgrounds[variant];

  return (
    <div className="fixed inset-0 -z-10">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${bgImage})`,
        }}
      />
      {/* Subtle overlay for better contrast */}
      <div className="absolute inset-0 bg-black/10" />
    </div>
  );
}
