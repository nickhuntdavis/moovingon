import React, { useState, useEffect } from 'react';
import { PackageOpen, Plus, Heart, MapPin, Clock as ClockIcon, MessageCircle, AlertCircle, ArrowUpDown, Users, Grid3x3, List, Search, X } from 'lucide-react';
import { Item, ViewMode, ItemStatus } from './types';
import { INITIAL_ITEMS } from './constants';
import ItemCard from './components/ItemCard';
import ItemForm from './components/ItemForm';
import AdminAuth from './components/AdminAuth';
import Button from './components/Button';
import FAQ from './components/FAQ';
import baserowService from './services/baserow';

export default function App() {
  // --- State ---
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [viewMode, setViewMode] = useState<ViewMode>('FRIEND');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    // Check localStorage for persisted admin authentication
    return localStorage.getItem('moovingon_admin_authenticated') === 'true';
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [sortBy, setSortBy] = useState<'default' | 'price' | 'condition'>('default');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [shuffledItems, setShuffledItems] = useState<Item[]>([]);
  const [mobileLayout, setMobileLayout] = useState<'vertical' | 'dense'>('vertical');
  const [adminSearchQuery, setAdminSearchQuery] = useState<string>('');
  const [lastClickTime, setLastClickTime] = useState<number>(0);

  // --- Load items from Baserow on mount ---
  useEffect(() => {
    loadItems();
  }, []);

  // --- Handle URL hash for item sharing ---
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#item-')) {
      const itemId = hash.replace('#item-', '');
      setHighlightedItemId(itemId);
      
      // Scroll to item after a short delay to ensure DOM is ready
      setTimeout(() => {
        const element = document.getElementById(`item-${itemId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Remove highlight after 5 seconds
          setTimeout(() => {
            setHighlightedItemId(null);
          }, 5000);
        }
      }, 100);
    }
  }, [items]);

  // Fisher-Yates shuffle algorithm
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const loadItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🔄 App: Loading items from Baserow...');
      const loadedItems = await baserowService.getAllItems();
      console.log(`✅ App: Loaded ${loadedItems.length} items`);
      const itemsToUse = loadedItems.length > 0 ? loadedItems : INITIAL_ITEMS;
      // Shuffle items on load for random order
      const shuffled = shuffleArray(itemsToUse);
      setShuffledItems(shuffled);
      setItems(shuffled);
    } catch (err: any) {
      console.error('❌ App: Failed to load items from Baserow:', err);
      const errorMsg = err?.message || 'Unknown error';
      setError(`Failed to load items: ${errorMsg}. Using local data.`);
      // Fallback to initial items or localStorage if available
      const saved = localStorage.getItem('moving_on_sale_items');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log(`📦 App: Using ${parsed.length} items from localStorage`);
          const shuffled = shuffleArray(parsed);
          setShuffledItems(shuffled);
          setItems(shuffled);
        } catch {
          console.log('📦 App: Using initial items');
          const shuffled = shuffleArray(INITIAL_ITEMS);
          setShuffledItems(shuffled);
          setItems(shuffled);
        }
      } else {
        console.log('📦 App: Using initial items');
        const shuffled = shuffleArray(INITIAL_ITEMS);
        setShuffledItems(shuffled);
        setItems(shuffled);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handlers ---
  
  const handleAddItem = async (newItemData: Omit<Item, 'id' | 'interestedParties' | 'createdAt'>) => {
    setIsSaving(true);
    setError(null);
    try {
      const newItem = await baserowService.createItem({
        ...newItemData,
        interestedParties: [],
      });
      setItems(prev => [newItem, ...prev]);
      setIsAddingItem(false);
    } catch (err) {
      console.error('Failed to create item:', err);
      setError('Failed to save item. Please try again.');
      // Optimistically add to UI anyway
      const tempItem: Item = {
        ...newItemData,
        id: Math.random().toString(36).substr(2, 9),
        interestedParties: [],
        createdAt: Date.now()
      };
      setItems(prev => [tempItem, ...prev]);
      setIsAddingItem(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditItem = async (updatedData: Omit<Item, 'id' | 'interestedParties' | 'createdAt'>) => {
    if (!editingItem) return;
    setIsSaving(true);
    setError(null);
    try {
      const updatedItem = await baserowService.updateItem({
        ...editingItem,
        ...updatedData,
      });
      setItems(prev => prev.map(item => 
        item.id === editingItem.id ? updatedItem : item
      ));
      setEditingItem(null);
    } catch (err) {
      console.error('Failed to update item:', err);
      setError('Failed to update item. Please try again.');
      // Optimistically update UI anyway
      setItems(prev => prev.map(item => 
        item.id === editingItem.id ? { ...item, ...updatedData } : item
      ));
      setEditingItem(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('Remove this item completely?')) return;
    setIsSaving(true);
    setError(null);
    try {
      await baserowService.deleteItem(id);
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Failed to delete item:', err);
      setError('Failed to delete item. Please try again.');
      // Optimistically remove from UI anyway
      setItems(prev => prev.filter(item => item.id !== id));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: ItemStatus, name?: string) => {
    setIsSaving(true);
    setError(null);
    const item = items.find(i => i.id === id);
    if (!item) return;

    const updatedItem: Item = {
      ...item,
      status,
    };
    
    if (name) {
      updatedItem.interestedParties = [
        ...item.interestedParties,
        { 
          name: `${name} (Marked by Admin)`, 
          timestamp: Date.now(), 
          type: status === 'TAKEN' ? 'TAKE' : 'INTEREST' 
        }
      ];
    }

    try {
      const saved = await baserowService.updateItem(updatedItem);
      setItems(prev => prev.map(i => i.id === id ? saved : i));
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('Failed to update status. Please try again.');
      // Optimistically update UI anyway
      setItems(prev => prev.map(i => i.id === id ? updatedItem : i));
    } finally {
      setIsSaving(false);
    }
  };

  const handleExpressInterest = async (id: string, name: string, type: 'TAKE' | 'INTEREST', question?: string) => {
    setIsSaving(true);
    setError(null);
    const item = items.find(i => i.id === id);
    if (!item) return;

    const updatedItem: Item = {
      ...item,
      status: 'RESERVED' as ItemStatus,
      interestedParties: [
        ...item.interestedParties,
        { name, timestamp: Date.now(), type, question }
      ]
    };

    try {
      const saved = await baserowService.updateItem(updatedItem);
      setItems(prev => prev.map(i => i.id === id ? saved : i));
      console.info(`Auto-reserved item ${id} for ${name}.`);
    } catch (err) {
      console.error('Failed to express interest:', err);
      setError('Failed to reserve item. Please try again.');
      // Optimistically update UI anyway
      setItems(prev => prev.map(i => i.id === id ? updatedItem : i));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveTaker = async (itemId: string, takerIndex: number) => {
    setIsSaving(true);
    setError(null);
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const updatedItem: Item = {
      ...item,
      interestedParties: item.interestedParties.filter((_, idx) => idx !== takerIndex)
    };

    try {
      const saved = await baserowService.updateItem(updatedItem);
      setItems(prev => prev.map(i => i.id === itemId ? saved : i));
      console.info(`Removed taker ${takerIndex} from item ${itemId}.`);
    } catch (err) {
      console.error('Failed to remove taker:', err);
      setError('Failed to remove from waitlist. Please try again.');
      // Optimistically update UI anyway
      setItems(prev => prev.map(i => i.id === itemId ? updatedItem : i));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdminAccess = () => {
    if (isAdminAuthenticated) {
      setViewMode(prev => prev === 'ADMIN' ? 'FRIEND' : 'ADMIN');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleMigrateLocalData = async () => {
    if (!window.confirm('This will upload all local items to Baserow. Continue?')) return;
    
    setIsSaving(true);
    setError(null);
    
    // Get local data
    const saved = localStorage.getItem('moving_on_sale_items');
    const localItems = saved ? JSON.parse(saved) : INITIAL_ITEMS;
    
    if (localItems.length === 0) {
      setError('No local items to migrate.');
      setIsSaving(false);
      return;
    }

    const results = { success: 0, failed: 0 };
    
    for (const item of localItems) {
      try {
        const { id, createdAt, interestedParties, ...itemData } = item;
        await baserowService.createItem({
          ...itemData,
          interestedParties: interestedParties || [],
        });
        results.success++;
      } catch (err) {
        console.error('Failed to migrate item:', item.title, err);
        results.failed++;
      }
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setIsSaving(false);
    
    if (results.failed === 0) {
      alert(`✅ Successfully migrated ${results.success} items to Baserow!`);
      // Reload items from Baserow
      loadItems();
    } else {
      setError(`Migrated ${results.success} items, ${results.failed} failed. Check console for details.`);
    }
  };

  // --- Derived State ---
  // Filter items for admin search
  const filteredItems = viewMode === 'ADMIN' && adminSearchQuery
    ? items.filter(item => {
        const query = adminSearchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query)) ||
          item.price.toString().includes(query) ||
          item.condition.toLowerCase().includes(query) ||
          item.status.toLowerCase().includes(query)
        );
      })
    : items;

  const sortedItems = [...filteredItems].sort((a, b) => {
     // First, sort by status (AVAILABLE → RESERVED → TAKEN)
     const statusOrder = { 'AVAILABLE': 0, 'RESERVED': 1, 'TAKEN': 2 };
     const statusDiff = statusOrder[a.status] - statusOrder[b.status];
     if (statusDiff !== 0) return statusDiff;
     
     // Then, apply user-selected sort
     if (sortBy === 'price') {
       const priceDiff = a.price - b.price;
       if (priceDiff !== 0) {
         return sortDirection === 'asc' ? priceDiff : -priceDiff;
       }
     } else if (sortBy === 'condition') {
       // Sort by condition: Good as new (0), Fair (1), Well Loved (2)
       const conditionOrder = { 'Good as new': 0, 'Fair': 1, 'Well Loved': 2 };
       const conditionDiff = (conditionOrder[a.condition as keyof typeof conditionOrder] ?? 999) - 
                            (conditionOrder[b.condition as keyof typeof conditionOrder] ?? 999);
       if (conditionDiff !== 0) {
         return sortDirection === 'asc' ? conditionDiff : -conditionDiff;
       }
     }
     
     // Finally, sort by creation date (newest first)
     return b.createdAt - a.createdAt;
  });

  const handleSortClick = (newSortBy: 'default' | 'price' | 'condition') => {
    if (sortBy === newSortBy) {
      // Toggle direction if clicking the same sort
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Change sort type and reset to ascending
      setSortBy(newSortBy);
      setSortDirection('asc');
    }
  };

  return (
    <div className={`min-h-screen pb-24 font-sans ${viewMode === 'ADMIN' ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-900'}`}>
      <main className="max-w-5xl mx-auto px-4 py-12 md:py-20">
        
        {/* Error Banner */}
        {error && (
          <div className={`mb-6 rounded-2xl p-4 flex items-center gap-3 ${viewMode === 'ADMIN' ? 'bg-rose-900/50 border border-rose-700' : 'bg-rose-50 border border-rose-200'}`}>
            <AlertCircle className={`flex-shrink-0 ${viewMode === 'ADMIN' ? 'text-rose-300' : 'text-rose-600'}`} size={20} />
            <p className={`text-sm font-medium ${viewMode === 'ADMIN' ? 'text-rose-100' : 'text-rose-800'}`}>{error}</p>
            <button 
              onClick={() => setError(null)}
              className={`ml-auto ${viewMode === 'ADMIN' ? 'text-rose-300 hover:text-rose-100' : 'text-rose-600 hover:text-rose-800'}`}
            >
              ×
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-20">
            <p className={`font-medium ${viewMode === 'ADMIN' ? 'text-stone-300' : 'text-stone-500'}`}>Loading items...</p>
          </div>
        )}

        {/* Hero Section */}
        {!isLoading && (
          <div className="mb-8 md:mb-12 lg:mb-16">
            {viewMode === 'ADMIN' ? (
              <div className="bg-stone-900 rounded-3xl p-6 md:p-8 text-white shadow-xl flex items-center justify-between mb-8 md:mb-12">
                <div>
                  <h2 className="text-xl md:text-2xl font-black mb-1">Owner Dashboard</h2>
                  <p className="text-stone-400 text-xs md:text-sm">
                    Managing {items.length} items. {isSaving ? 'Saving...' : 'Synced with Baserow.'}
                  </p>
                </div>
              <div className="flex gap-2 md:gap-3 flex-wrap">
                <Button variant="primary" size="sm" onClick={() => { setEditingItem(null); setIsAddingItem(true); }} className="bg-indigo-500 hover:bg-indigo-600 text-white border-none font-bold px-3 md:px-4 text-xs md:text-sm">
                  <Plus size={16} className="mr-1" /> Add Item
                </Button>
                <Button variant="ghost" size="sm" onClick={handleMigrateLocalData} disabled={isSaving} className="text-stone-300 hover:text-white hover:bg-white/10 text-xs md:text-sm">
                  {isSaving ? 'Migrating...' : '📦 Migrate Local Data'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setViewMode('FRIEND')} className="text-stone-300 hover:text-white hover:bg-white/10 text-xs md:text-sm">
                  Exit
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10 items-start">
              <div className="lg:col-span-2 space-y-4 md:space-y-6">
                <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-2">
                   <PackageOpen size={14} /> Nick's Moving Sale
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
                  Take Nick's stuff
                </h2>
                <p className="text-lg md:text-xl text-stone-600 leading-relaxed font-medium max-w-xl">
                  I'm moving back to SA soon and need to re-home these things quickly. Please take my stuff.
                </p>
                <div className="flex items-center gap-3 text-stone-500 text-sm">
                  <MessageCircle size={18} className="text-indigo-600" />
                  <span>Questions? WhatsApp Nick at <a href="https://wa.me/31618509055" className="font-bold text-indigo-700 hover:underline">+31 6 1850 9055</a></span>
                </div>
                
                {/* Sort Controls - Desktop only, underneath WhatsApp */}
                <div className="hidden md:flex items-center gap-3 flex-wrap pt-2">
                  <ArrowUpDown size={16} className="text-stone-400" />
                  <span className="text-xs font-bold text-stone-600">Sort by:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSortClick('default')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        sortBy === 'default'
                          ? 'bg-indigo-500 text-white shadow-lg'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      Default
                    </button>
                    <button
                      onClick={() => handleSortClick('price')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        sortBy === 'price'
                          ? 'bg-indigo-500 text-white shadow-lg'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      Price {sortBy === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                      onClick={() => handleSortClick('condition')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        sortBy === 'condition'
                          ? 'bg-indigo-500 text-white shadow-lg'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      Condition {sortBy === 'condition' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block space-y-3 md:space-y-4 lg:pt-4">
                <div 
                  className="flex items-start gap-3 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm transition-transform hover:-translate-y-1 cursor-pointer"
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    const now = Date.now();
                    if (now - lastClickTime < 500) {
                      // Double-click detected
                      if (isAdminAuthenticated) {
                        setViewMode('ADMIN');
                      } else {
                        setIsAuthModalOpen(true);
                      }
                    }
                    setLastClickTime(now);
                  }}
                >
                  <ClockIcon className="text-indigo-500 mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-tight">Gone by Mid Jan</h4>
                    <p className="text-stone-500 text-xs mt-1">First come, first served.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm transition-transform hover:-translate-y-1">
                  <MapPin className="text-indigo-500 mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-tight">Central Utrecht</h4>
                    <p className="text-stone-500 text-xs mt-1">Easy collection near the station.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm transition-transform hover:-translate-y-1">
                  <Users className="text-indigo-500 mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-tight">Friends only</h4>
                    <p className="text-stone-500 text-xs mt-1">
                      More about sharing in <a href="#faq" className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline" onClick={(e) => {
                        e.preventDefault();
                        const faqElement = document.getElementById('faq');
                        if (faqElement) {
                          faqElement.scrollIntoView({ behavior: 'smooth' });
                          // Open the "Can I share this link with other people?" accordion (index 5)
                          setTimeout(() => {
                            const shareFAQIndex = 5; // "Can I share this link with other people?"
                            window.dispatchEvent(new CustomEvent('openFAQ', { detail: shareFAQIndex }));
                          }, 500);
                        }
                      }}>FAQ</a>
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Mobile: Horizontal scrollable info cards */}
              <div className="lg:hidden -mx-4 px-4 overflow-x-auto pb-2">
                <div className="flex gap-3 min-w-max">
                  <div 
                    className="flex items-start gap-2 bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex-shrink-0 min-w-[200px] cursor-pointer"
                    onDoubleClick={(e) => {
                      e.preventDefault();
                      const now = Date.now();
                      if (now - lastClickTime < 500) {
                        // Double-click detected
                        if (isAdminAuthenticated) {
                          setViewMode('ADMIN');
                        } else {
                          setIsAuthModalOpen(true);
                        }
                      }
                      setLastClickTime(now);
                    }}
                  >
                    <ClockIcon className="text-indigo-500 mt-0.5 flex-shrink-0" size={18} />
                    <div>
                      <h4 className="font-black text-xs uppercase tracking-tight">Gone by Mid Jan</h4>
                      <p className="text-stone-500 text-[10px] mt-0.5">First come, first served.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex-shrink-0 min-w-[200px]">
                    <MapPin className="text-indigo-500 mt-0.5 flex-shrink-0" size={18} />
                    <div>
                      <h4 className="font-black text-xs uppercase tracking-tight">Central Utrecht</h4>
                      <p className="text-stone-500 text-[10px] mt-0.5">Easy collection near the station.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex-shrink-0 min-w-[200px]">
                    <Users className="text-indigo-500 mt-0.5 flex-shrink-0" size={18} />
                    <div>
                      <h4 className="font-black text-xs uppercase tracking-tight">Friends only</h4>
                      <p className="text-stone-500 text-[10px] mt-0.5">
                        More about sharing in <a href="#faq" className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline" onClick={(e) => {
                          e.preventDefault();
                          const faqElement = document.getElementById('faq');
                          if (faqElement) {
                            faqElement.scrollIntoView({ behavior: 'smooth' });
                            // Open the "Can I share this link with other people?" accordion (index 5)
                            setTimeout(() => {
                              const shareFAQIndex = 5; // "Can I share this link with other people?"
                              window.dispatchEvent(new CustomEvent('openFAQ', { detail: shareFAQIndex }));
                            }, 500);
                          }
                        }}>FAQ</a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        )}

        {/* Admin Form */}
        {!isLoading && viewMode === 'ADMIN' && (isAddingItem || editingItem) && (
          <div className="mb-16 max-w-xl mx-auto scroll-mt-20" id="item-form">
            <ItemForm 
              initialData={editingItem || undefined}
              onSubmit={editingItem ? handleEditItem : handleAddItem}
              onCancel={() => { setIsAddingItem(false); setEditingItem(null); }}
            />
          </div>
        )}

        {/* Sort Controls and Layout Toggle - Mobile only, show in friend view */}
        {!isLoading && viewMode === 'FRIEND' && (
          <div className="md:hidden mb-6 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <ArrowUpDown size={16} className="text-stone-400" />
              <span className="text-xs font-bold text-stone-600">Sort:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSortClick('default')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    sortBy === 'default'
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Default
                </button>
                <button
                  onClick={() => handleSortClick('price')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    sortBy === 'price'
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Price {sortBy === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
                <button
                  onClick={() => handleSortClick('condition')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    sortBy === 'condition'
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Condition {sortBy === 'condition' && (sortDirection === 'asc' ? '↑' : '↓')}
                </button>
              </div>
            </div>
            {/* Layout Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-600">Layout:</span>
              <button
                onClick={() => setMobileLayout(mobileLayout === 'vertical' ? 'dense' : 'vertical')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-stone-100 text-stone-600 hover:bg-stone-200"
                aria-label="Toggle layout"
              >
                {mobileLayout === 'vertical' ? <Grid3x3 size={16} /> : <List size={16} />}
                <span>{mobileLayout === 'vertical' ? 'Cards' : 'Dense'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Item Grid */}
        {!isLoading && (
          <>
            {viewMode === 'ADMIN' && adminSearchQuery && sortedItems.length === 0 && (
              <div className="text-center py-12">
                <p className="text-stone-400 text-lg">No items found matching "{adminSearchQuery}"</p>
                <button
                  onClick={() => setAdminSearchQuery('')}
                  className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-bold"
                >
                  Clear search
                </button>
              </div>
            )}
            {viewMode === 'FRIEND' && mobileLayout === 'dense' ? (
              // Dense mobile layout
              <div className="md:hidden space-y-3">
                {sortedItems.map(item => (
                  <div key={item.id} id={`item-${item.id}`} className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden flex flex-row h-32">
                    <div className="w-1/3 aspect-square bg-stone-100 overflow-hidden">
                      <img 
                        src={item.images[0] || ''} 
                        alt={item.title} 
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="w-2/3 p-3 flex flex-col justify-between">
                      <div>
                        <h3 className="text-sm font-black text-stone-900 leading-tight mb-1 line-clamp-2">{item.title}</h3>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-indigo-600">€{item.price}</span>
                          <span className="text-[10px] text-stone-400 uppercase">{item.condition}</span>
                        </div>
                      </div>
                      {item.status === 'AVAILABLE' && (
                        <button
                          onClick={() => handleExpressInterest(item.id, '', 'TAKE')}
                          className="text-xs font-black bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg transition-colors"
                        >
                          I'll take it
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Standard vertical layout
              <div className={`grid grid-cols-1 ${mobileLayout === 'dense' ? 'sm:grid-cols-1' : 'sm:grid-cols-2'} lg:grid-cols-3 gap-8 md:gap-10`}>
                {sortedItems.map(item => (
                  <div key={item.id} id={`item-${item.id}`}>
                    <ItemCard
                      item={item}
                      mode={viewMode}
                      onExpressInterest={handleExpressInterest}
                      onUpdateStatus={handleUpdateStatus}
                      onDelete={handleDeleteItem}
                      onEdit={() => { 
                        setEditingItem(item); 
                        setIsAddingItem(false);
                        if (viewMode === 'ADMIN') {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        } else {
                          document.getElementById('item-form')?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      onRemoveTaker={viewMode === 'ADMIN' ? handleRemoveTaker : undefined}
                      isHighlighted={highlightedItemId === item.id}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* FAQ Section - Only show in friend view */}
      {viewMode === 'FRIEND' && <FAQ viewMode={viewMode} />}

      {/* Footer */}
      <footer className={`mt-20 border-t py-16 px-4 text-center ${viewMode === 'ADMIN' ? 'border-stone-700' : 'border-stone-200'}`}>
        <p className={`text-sm font-medium flex items-center justify-center gap-2 ${viewMode === 'ADMIN' ? 'text-stone-400' : 'text-stone-400'}`}>
          Made with <Heart size={14} className="text-rose-400 fill-rose-400" /> for Nick's friends.
        </p>
        <button 
          onClick={handleAdminAccess}
          className={`mt-8 text-[10px] transition-colors uppercase tracking-[0.2em] font-black ${viewMode === 'ADMIN' ? 'text-stone-400 hover:text-stone-200' : 'text-stone-300 hover:text-stone-500'}`}
        >
          {isAdminAuthenticated ? 'Admin Panel Active' : 'Owner Login'}
        </button>
      </footer>

      <AdminAuth 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={() => {
          setIsAdminAuthenticated(true);
          // Persist admin authentication in localStorage
          localStorage.setItem('moovingon_admin_authenticated', 'true');
          setViewMode('ADMIN');
        }} 
      />
    </div>
  );
}
