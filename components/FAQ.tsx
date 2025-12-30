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
      question: "How do I claim an item?",
      answer: "Simply click 'I'll take it!' on any item you want. You'll be redirected to WhatsApp to confirm with Nick. First come, first served!"
    },
    {
      question: "Where can I pick up items?",
      answer: "All items are available for pickup in Central Utrecht, near the station. Nick will share the exact address when you contact him via WhatsApp."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const isDark = viewMode === 'ADMIN';

  return (
    <section className={`mt-20 py-16 px-4 ${isDark ? 'bg-stone-800' : 'bg-white'}`}>
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
                  <p className="leading-relaxed font-medium">{faq.answer}</p>
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

