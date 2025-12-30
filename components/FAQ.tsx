import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  viewMode: 'ADMIN' | 'FRIEND';
}

const FAQ: React.FC<FAQProps> = ({ viewMode }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: "Where are the items located? Where do I pick them up?",
      answer: "All items are located at my home in Utrecht, right by Tivoli (the music venue) and about 4 minutes from Utrecht Central Station. It's very easy to reach by public transport, and also straightforward if you're coming by car. You can park nearby on the corner for loading larger items.\n\nImportant practical note:\nThe apartment is on the second floor and there is no lift, elevator, or external pulley system. Everything needs to be carried up and down the stairs.\n\nIf you're collecting large or heavy items (for example furniture), please bring help. You'll also need to bring blankets, straps, or padding so we don't damage the stairwell walls when moving things out."
    },
    {
      question: "When can I pick items up?",
      answer: "I'm very flexible. Pickup is possible almost any time, as long as we agree on it in advance.\n\nJust message me and suggest a time that works for you, and I'll do my best to make sure I'm available."
    },
    {
      question: "When does everything need to be gone by?",
      answer: "ASAP.\nI'm moving at the end of January, and the apartment needs to be emptied and cleaned by 17 January.\n\nThe sooner items can be picked up, the better."
    },
    {
      question: "Why are some items so cheap (or free)?",
      answer: "I am also selling items on Marktplaats, but here I'm offering things much cheaper, and in some cases for free.\n\nThe goal is to get everything out quickly and, ideally, into good homes with people I know. Some items may be offered here first before being listed publicly."
    },
    {
      question: "I like something, but it's too expensive for me. What should I do?",
      answer: "Please just tell me.\n\nI'm very open to dropping the price, or even giving the item away, especially if you can collect it soon. Getting things out in time is more important to me than the exact price."
    },
    {
      question: "Can I share this link with other people?",
      answer: "Yes — with discretion.\n\nThis is intended for friends and trusted friends-of-friends, since I'll be inviting people into my home and offering items at very friendly prices.\nIf it's someone you know and trust, please feel free to share the link with them."
    },
    {
      question: "How does payment work?",
      answer: "Tikkie is best, or an iDEAL transfer.\n\nCash is not ideal, as I won't be able to take it with me when I leave. Payment at pickup is perfectly fine."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const isDark = viewMode === 'ADMIN';

  return (
    <section id="faq" className={`mt-20 py-16 px-4 ${isDark ? 'bg-stone-800' : 'bg-white'}`}>
      <div className="max-w-3xl mx-auto">
        <h2 className={`text-3xl font-black mb-8 ${isDark ? 'text-white' : 'text-stone-900'}`}>
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`border rounded-2xl overflow-hidden transition-all ${
                isDark 
                  ? 'border-stone-700 bg-stone-900/50' 
                  : 'border-stone-200 bg-stone-50'
              }`}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className={`w-full px-6 py-4 flex items-center justify-between text-left transition-colors ${
                  isDark 
                    ? 'hover:bg-stone-800' 
                    : 'hover:bg-stone-100'
                }`}
                aria-expanded={openIndex === index}
              >
                <h3 className={`font-black text-lg pr-4 ${isDark ? 'text-white' : 'text-stone-900'}`}>
                  {faq.question}
                </h3>
                {openIndex === index ? (
                  <ChevronUp 
                    size={20} 
                    className={`flex-shrink-0 ${isDark ? 'text-stone-400' : 'text-stone-500'}`} 
                  />
                ) : (
                  <ChevronDown 
                    size={20} 
                    className={`flex-shrink-0 ${isDark ? 'text-stone-400' : 'text-stone-500'}`} 
                  />
                )}
              </button>
              {openIndex === index && (
                <div className={`px-6 pb-4 ${isDark ? 'text-stone-300' : 'text-stone-600'}`}>
                  <div className="leading-relaxed font-medium whitespace-pre-line">{faq.answer}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;

