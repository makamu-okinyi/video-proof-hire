import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface PitchVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title?: string;
}

/**
 * Custom modal for pitch video - avoids Dialog zoom animation which causes
 * video centering to flash only on close. Uses fade-only + stable dimensions.
 */
export function PitchVideoModal({ isOpen, onClose, videoUrl, title = 'Applicant Pitch Video' }: PitchVideoModalProps) {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pitch-video-title"
            className="fixed left-1/2 top-1/2 z-50 w-[min(90vw,560px)] -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-background rounded-2xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <h2 id="pitch-video-title" className="font-semibold text-charcoal">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div
                className="bg-black"
                style={{
                  aspectRatio: '16/9',
                  width: '100%',
                  minHeight: 0,
                }}
              >
                <video
                  src={videoUrl}
                  controls
                  autoPlay
                  playsInline
                  preload="auto"
                  className="w-full h-full object-contain"
                  style={{ display: 'block' }}
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
