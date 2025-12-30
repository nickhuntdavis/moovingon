import React, { useState, useEffect } from 'react';
import { PackageOpen, Plus, Heart, MapPin, Clock as ClockIcon, MessageCircle, AlertCircle } from 'lucide-react';
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

  // --- Load items from Baserow on mount ---
  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('🔄 App: Loading items from Baserow...');
      const loadedItems = await baserowService.getAllItems();
      console.log(`✅ App: Loaded ${loadedItems.length} items`);
      setItems(loadedItems.length > 0 ? loadedItems : INITIAL_ITEMS);
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
          setItems(parsed);
        } catch {
          console.log('📦 App: Using initial items');
          setItems(INITIAL_ITEMS);
        }
      } else {
        console.log('📦 App: Using initial items');
        setItems(INITIAL_ITEMS);
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
  const sortedItems = [...items].sort((a, b) => {
     const statusOrder = { 'AVAILABLE': 0, 'RESERVED': 1, 'TAKEN': 2 };
     const statusDiff = statusOrder[a.status] - statusOrder[b.status];
     if (statusDiff !== 0) return statusDiff;
     return b.createdAt - a.createdAt;
  });

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
          <div className="mb-16">
            {viewMode === 'ADMIN' ? (
              <div className="bg-stone-900 rounded-3xl p-8 text-white shadow-xl flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-2xl font-black mb-1">Owner Dashboard</h2>
                  <p className="text-stone-400 text-sm">
                    Managing {items.length} items. {isSaving ? 'Saving...' : 'Synced with Baserow.'}
                  </p>
                </div>
              <div className="flex gap-3 flex-wrap">
                <Button variant="primary" size="sm" onClick={() => { setEditingItem(null); setIsAddingItem(true); }} className="bg-indigo-500 hover:bg-indigo-600 text-white border-none font-bold px-4">
                  <Plus size={18} className="mr-1" /> Add Item
                </Button>
                <Button variant="ghost" size="sm" onClick={handleMigrateLocalData} disabled={isSaving} className="text-stone-300 hover:text-white hover:bg-white/10">
                  {isSaving ? 'Migrating...' : '📦 Migrate Local Data'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setViewMode('FRIEND')} className="text-stone-300 hover:text-white hover:bg-white/10">
                  Exit
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
              <div className="lg:col-span-2 space-y-6">
                <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase mb-2">
                   <PackageOpen size={14} /> Nick's Moving Sale
                </div>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.1]">
                  Take Nick's stuff
                </h2>
                <p className="text-xl text-stone-600 leading-relaxed font-medium max-w-xl">
                  I’m moving back to SA soon and need to re-home these things quickly. Please take my stuff.
                </p>
                <div className="flex items-center gap-3 text-stone-500 text-sm">
                  <MessageCircle size={18} className="text-indigo-600" />
                  <span>Questions? WhatsApp Nick at <a href="https://wa.me/31618509055" className="font-bold text-indigo-700 hover:underline">+31 6 1850 9055</a></span>
                </div>
              </div>

              <div className="space-y-4 lg:pt-4">
                <div className="flex items-start gap-3 bg-white p-5 rounded-2xl border border-stone-200 shadow-sm transition-transform hover:-translate-y-1">
                  <ClockIcon className="text-indigo-500 mt-1 flex-shrink-0" size={24} />
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-tight">Gone by Early Jan</h4>
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

        {/* Item Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {sortedItems.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                mode={viewMode}
                onExpressInterest={handleExpressInterest}
                onUpdateStatus={handleUpdateStatus}
                onDelete={handleDeleteItem}
                onEdit={() => { 
                  setEditingItem(item); 
                  setIsAddingItem(false); 
                  document.getElementById('item-form')?.scrollIntoView({ behavior: 'smooth' });
                }}
                onRemoveTaker={viewMode === 'ADMIN' ? handleRemoveTaker : undefined}
              />
            ))}
          </div>
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
