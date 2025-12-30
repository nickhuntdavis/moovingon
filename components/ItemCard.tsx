import React, { useState, useEffect, useRef } from 'react';
import { Item, ViewMode } from '../types';
import { Trash2, ChevronLeft, ChevronRight, Edit3, ChevronDown, ChevronUp, X as XIcon, Share2 } from 'lucide-react';
import Badge from './Badge';
import Button from './Button';
import InterestModal from './InterestModal';
import ImageLightbox from './ImageLightbox';

interface ItemCardProps {
  item: Item;
  mode: ViewMode;
  onExpressInterest: (id: string, name: string, type: 'TAKE' | 'INTEREST', question?: string) => void;
  onUpdateStatus: (id: string, status: Item['status'], name?: string) => void;
  onDelete: (id: string) => void;
  onEdit: () => void;
  onRemoveTaker?: (itemId: string, takerIndex: number) => void;
  isHighlighted?: boolean;
}

const ItemCard: React.FC<ItemCardProps> = ({ 
  item, 
  mode, 
  onExpressInterest, 
  onUpdateStatus,
  onDelete,
  onEdit,
  onRemoveTaker,
  isHighlighted = false
}) => {
  const [interestConfig, setInterestConfig] = useState<{ open: boolean; type: 'TAKE' | 'INTEREST' }>({ open: false, type: 'TAKE' });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [nextImageIndex, setNextImageIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  
  const isAvailable = item.status === 'AVAILABLE';
  const isReserved = item.status === 'RESERVED';
  const isTaken = item.status === 'TAKEN';
  
  useEffect(() => {
    if (item.images.length <= 1) return;
    // Start animation immediately (no delay)
    const intervalId = setInterval(() => {
      const next = (currentImageIndex + 1) % item.images.length;
      setNextImageIndex(next);
      // After fade transition completes, update current index
      setTimeout(() => {
        setCurrentImageIndex(next);
        setNextImageIndex(null);
      }, 3000); // Match transition duration
    }, 20000); // 20 seconds between image changes
    return () => clearInterval(intervalId);
  }, [item.images.length, currentImageIndex]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current || item.images.length <= 1) return;
    
    const distanceX = touchStartX.current - touchEndX.current;
    const distanceY = touchStartY.current - touchEndY.current;
    const absDistanceX = Math.abs(distanceX);
    const absDistanceY = Math.abs(distanceY);
    
    // Only trigger if horizontal swipe is significant and more than vertical
    if (absDistanceX > 50 && absDistanceX > absDistanceY * 1.5) {
      if (distanceX > 0) {
        // Swipe left - next image
        setCurrentImageIndex(prev => (prev + 1) % item.images.length);
      } else {
        // Swipe right - previous image
        setCurrentImageIndex(prev => (prev - 1 + item.images.length) % item.images.length);
      }
    }
    
    // Reset
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}${window.location.pathname}#item-${item.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev + 1) % item.images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(prev => (prev - 1 + item.images.length) % item.images.length);
  };

  const handleAdminStatusUpdate = (status: Item['status']) => {
    const name = window.prompt(`Who are you marking this for? (Optional)`);
    onUpdateStatus(item.id, status, name || undefined);
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const renderRichText = (html: string) => {
    if (!html) return null;
    return (
      <div 
        className="rich-text-content text-stone-600 leading-relaxed font-medium"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  const renderCollapsed = (html: string) => {
    if (!html) return null;
    const text = stripHtml(html);
    return <p className="line-clamp-5 text-stone-500 leading-relaxed font-medium">{text}</p>;
  };

  const hasMore = (html: string) => {
    if (!html) return false;
    const text = stripHtml(html);
    if (!text.trim()) return false;
    
    // Estimate if text would exceed 5 lines
    // For text-sm with leading-relaxed, typical line width is ~60-70 characters
    // With line-clamp-5, we want to check if text exceeds ~350 characters (5 lines * 70 chars)
    // But we also need to account for word wrapping, so we'll use a more conservative estimate
    // Count actual line breaks and estimate based on character count
    const lineBreaks = (text.match(/\n/g) || []).length;
    const estimatedLines = lineBreaks + Math.ceil((text.length - lineBreaks) / 70);
    
    // Show "Click for more" only if estimated lines exceed 5
    return estimatedLines > 5;
  };

  const cardStyle = isTaken ? 'opacity-60 grayscale' : 'opacity-100';
  const highlightStyle = isHighlighted 
    ? 'border-4 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] ring-4 ring-indigo-500/30' 
    : 'border border-stone-200';

  return (
    <div className={`bg-white rounded-[2rem] shadow-sm ${highlightStyle} overflow-hidden flex flex-col h-full transition-all duration-500 hover:shadow-2xl ${cardStyle} relative`}>
      {/* Share Button */}
      {mode === 'FRIEND' && (
        <div className="absolute top-4 right-4 z-[9999]">
          <button
            onClick={handleShare}
            className="relative bg-white/90 backdrop-blur p-2 rounded-full shadow-lg hover:bg-white transition-all group"
            aria-label="Share item"
            title="Share this item"
          >
            <Share2 size={16} className={`text-stone-600 group-hover:text-indigo-600 transition-colors ${shareCopied ? 'text-indigo-600' : ''}`} />
          </button>
          {shareCopied && (
            <div className="absolute -top-12 right-0 bg-indigo-600 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap shadow-2xl z-[10000] pointer-events-none">
              Link copied!
            </div>
          )}
        </div>
      )}
      
      {/* Visual Header / Gallery */}
      <div 
        ref={imageContainerRef}
        className="relative aspect-square bg-stone-100 overflow-hidden group cursor-pointer touch-pan-y"
        onClick={() => item.images.length > 0 && setIsLightboxOpen(true)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Current image */}
        <img 
          src={item.images[currentImageIndex]} 
          alt={item.title} 
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 w-full h-full object-cover group-hover:scale-110 ${
            nextImageIndex !== null ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ transition: 'opacity 3s ease-in-out, transform 1s ease-out' }}
        />
        {/* Next image (for crossfade) */}
        {nextImageIndex !== null && (
          <img 
            src={item.images[nextImageIndex]} 
            alt={item.title} 
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 opacity-100"
            style={{ transition: 'opacity 3s ease-in-out, transform 1s ease-out' }}
          />
        )}
        
        {item.images.length > 1 && (
          <>
            <button 
              onClick={prevImage} 
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity text-stone-700"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={nextImage} 
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity text-stone-700"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 bg-black/30 backdrop-blur-md rounded-full">
              {item.images.map((_, idx) => (
                <div key={idx} className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'bg-white w-3' : 'bg-white/40'}`} />
              ))}
            </div>
          </>
        )}

        {!isAvailable && (
          <div className="absolute inset-0 bg-stone-900/10 backdrop-blur-[2px] flex items-center justify-center p-6">
             <div className="bg-white/95 px-5 py-3 rounded-2xl shadow-2xl border border-white/20">
               <span className="text-stone-900 font-black tracking-tight text-xs uppercase">
                 {isReserved ? 'Someone is interested' : 'Gone'}
               </span>
             </div>
          </div>
        )}
      </div>

      <div className="p-7 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="stone" className="text-[10px] uppercase tracking-[0.15em] font-black px-3">
            {item.condition}
          </Badge>
          
          <div className="flex items-center gap-2">
            {item.price === 0 ? (
              <span className="relative overflow-hidden text-emerald-950 font-black text-[11px] uppercase tracking-[0.2em] bg-emerald-400 px-4 py-2 rounded-full border-2 border-emerald-500 shadow-[0_0_15px_rgba(52,211,153,0.3)] shimmer-badge">
                FREE
              </span>
            ) : (
              <span className="text-stone-900 font-black text-xs tracking-widest bg-stone-50 px-3 py-2 rounded-full border border-stone-200">
                €{item.price}
              </span>
            )}
          </div>
        </div>
        
        <h3 className="text-2xl font-black text-stone-900 leading-tight mb-3 tracking-tight">{item.title}</h3>
        
        {item.description && (
          <div className="mb-8">
            <div className="text-sm">
              {isExpanded ? renderRichText(item.description) : renderCollapsed(item.description)}
            </div>
            {hasMore(item.description) && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-3 text-xs font-black text-indigo-500 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-1 transition-colors"
              >
                {isExpanded ? (
                  <>Show less <ChevronUp size={12} /></>
                ) : (
                  <>Click for more <ChevronDown size={12} /></>
                )}
              </button>
            )}
          </div>
        )}

        <div className="mt-auto space-y-4">
          {mode === 'FRIEND' && (
            <div className="space-y-2">
               {!isTaken ? (
                 <>
                   <Button 
                      fullWidth 
                      size="lg"
                      onClick={() => setInterestConfig({ open: true, type: 'TAKE' })}
                      className="rounded-2xl shadow-lg font-black uppercase tracking-widest"
                    >
                      I'll take it!
                   </Button>
                   <Button 
                      fullWidth 
                      variant="ghost"
                      onClick={() => setInterestConfig({ open: true, type: 'INTEREST' })}
                      className="rounded-2xl font-bold text-stone-500 hover:text-stone-900"
                    >
                      I'm interested
                   </Button>
                   {isReserved && (
                     <p className="text-[10px] text-indigo-500 text-center font-bold uppercase tracking-widest pt-1">
                        Someone is already interested, but you can still grab it!
                     </p>
                   )}
                 </>
               ) : (
                 <div className="text-center py-4 px-4 rounded-2xl bg-stone-100 text-stone-500 font-black text-xs uppercase tracking-widest border border-stone-200/50">
                    Re-homed
                 </div>
               )}
            </div>
          )}

          {mode === 'ADMIN' && (
            <div className="space-y-4 pt-4 border-t border-stone-100">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                    Waitlist ({item.interestedParties.length})
                  </span>
                </div>
                {item.interestedParties.length > 0 ? (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                     {item.interestedParties.map((p, idx) => (
                        <div key={idx} className="bg-stone-50 p-2.5 rounded-xl border border-stone-100 group relative">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className={`text-xs font-bold ${p.type === 'TAKE' ? 'text-indigo-600' : 'text-stone-600'}`}>
                              {p.name} {p.type === 'TAKE' ? '🙋‍♂️' : '💬'}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-stone-400 font-medium">
                                {new Date(p.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                              {onRemoveTaker && (
                                <button
                                  onClick={() => onRemoveTaker(item.id, idx)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-rose-100 rounded text-rose-500 hover:text-rose-700"
                                  aria-label="Remove from waitlist"
                                  title="Remove from waitlist"
                                >
                                  <XIcon size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                          {p.question && (
                            <p className="text-[10px] text-stone-500 leading-tight italic">"{p.question}"</p>
                          )}
                        </div>
                     ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-stone-300 italic py-2">No activity yet.</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                 <div className="grid grid-cols-2 gap-2">
                   {isAvailable && (
                      <Button variant="secondary" size="sm" onClick={() => handleAdminStatusUpdate('RESERVED')} className="rounded-xl text-[10px] font-black uppercase tracking-widest">Reserve</Button>
                   )}
                   {isReserved && (
                      <>
                       <Button variant="secondary" size="sm" onClick={() => onUpdateStatus(item.id, 'AVAILABLE')} className="rounded-xl text-[10px] font-black uppercase tracking-widest">Unreserve</Button>
                       <Button variant="primary" size="sm" onClick={() => handleAdminStatusUpdate('TAKEN')} className="rounded-xl text-[10px] font-black uppercase tracking-widest bg-stone-900 border-none">Taken</Button>
                      </>
                   )}
                   {isTaken && (
                       <Button variant="secondary" size="sm" onClick={() => onUpdateStatus(item.id, 'AVAILABLE')} className="rounded-xl text-[10px] font-black uppercase tracking-widest w-full col-span-2">Relist</Button>
                   )}
                 </div>
                 
                 <div className="flex gap-2">
                    <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-2 p-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest">
                      <Edit3 size={14} /> Edit
                    </button>
                    <button onClick={() => onDelete(item.id)} className="p-2.5 text-stone-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                      <Trash2 size={16} />
                    </button>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <InterestModal
        isOpen={interestConfig.open}
        itemTitle={item.title}
        type={interestConfig.type}
        onClose={() => setInterestConfig(prev => ({ ...prev, open: false }))}
        onConfirm={(name, question) => onExpressInterest(item.id, name, interestConfig.type, question)}
      />

      <ImageLightbox
        images={item.images}
        currentIndex={currentImageIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        onNavigate={(index) => setCurrentImageIndex(index)}
      />
    </div>
  );
};

export default ItemCard;