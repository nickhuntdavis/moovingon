import React, { useState, useEffect } from 'react';
import { X, CheckCircle, MessageCircle, ArrowRight } from 'lucide-react';
import Button from './Button';

interface InterestModalProps {
  itemTitle: string;
  isOpen: boolean;
  type: 'TAKE' | 'INTEREST';
  onClose: () => void;
  onConfirm: (name: string, question?: string) => void;
}

const InterestModal: React.FC<InterestModalProps> = ({ itemTitle, isOpen, type, onClose, onConfirm }) => {
  const [name, setName] = useState('');
  const [question, setQuestion] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setQuestion('');
      setSubmitted(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onConfirm(name, type === 'INTEREST' ? question : undefined);
      setSubmitted(true);
      // We don't auto-close anymore because we want them to click the WhatsApp button
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hey Nick! It's ${name}. I just marked the "${itemTitle}" as "${type === 'TAKE' ? "I'll take it" : "I'm interested"}" on your moving site. ${question ? `\n\nMy question: ${question}` : ''}`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-md">
      <div 
        className="bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full p-8 relative animate-fade-in-up" 
        role="dialog" 
        aria-labelledby="modal-title"
      >
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-stone-300 hover:text-stone-900 transition-colors" 
          aria-label="Close modal"
        >
          <X size={24} />
        </button>

        {submitted ? (
          <div className="text-center py-2">
            <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-black text-stone-900 mb-2">Reserved for you!</h3>
            <p className="text-stone-500 font-medium leading-relaxed mb-8">
              Nice one, {name}! I've put your name on it.<br />
              <span className="font-bold text-indigo-600">Now, send Nick a quick WhatsApp to arrange collection.</span>
            </p>
            
            <a 
              href={`https://wa.me/31618509055?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest p-5 rounded-2xl shadow-xl shadow-emerald-100 transition-all transform hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3">
                <MessageCircle size={24} />
                <span>Open WhatsApp</span>
              </div>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </a>
            
            <button 
              onClick={onClose}
              className="mt-6 text-[10px] font-black text-stone-300 hover:text-stone-500 uppercase tracking-[0.2em] transition-colors"
            >
              I'll do it later
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8">
               <h3 id="modal-title" className="text-2xl font-black text-stone-900 mb-2 tracking-tight leading-tight">
                 {type === 'TAKE' ? `Great choice!` : `Interested in this?`}
               </h3>
               <p className="text-sm text-stone-500 font-medium leading-relaxed">
                 {type === 'TAKE' 
                   ? `You're marking the "${itemTitle}" as yours. We'll reserve it immediately.` 
                   : `Nick will reserve the "${itemTitle}" while you ask your question.`}
               </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="user-name" className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 ml-1">Your Name</label>
                <input
                  id="user-name"
                  type="text"
                  autoFocus
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border-2 border-stone-100 focus:border-indigo-500 focus:ring-0 p-4 font-bold text-lg text-stone-900 bg-stone-50 transition-all"
                  placeholder="e.g. Sarah"
                />
              </div>

              {type === 'INTEREST' && (
                <div>
                  <label htmlFor="user-question" className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 ml-1">Your Question</label>
                  <textarea
                    id="user-question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="w-full rounded-2xl border-2 border-stone-100 focus:border-indigo-500 focus:ring-0 p-4 font-medium text-sm text-stone-900 bg-stone-50 transition-all"
                    rows={2}
                    placeholder="e.g. Is it heavy?"
                  />
                </div>
              )}

              <Button type="submit" fullWidth size="lg" className="rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 py-5">
                {type === 'TAKE' ? "I'll take it!" : "Ask Nick"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default InterestModal;
