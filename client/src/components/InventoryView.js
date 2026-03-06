import React, { useState, useEffect } from 'react';
import { WidgetCard } from './ui/WidgetCard';
import { GlassyPill } from './ui/GlassyPill';
import {
  Package, Gift, ShoppingBag, Archive, Plus, Minus,
  Search, Filter, Box, Tag, Truck, Users, Sparkles, X, Trash2
} from 'lucide-react';
import LobsterScrollArea from './ui/LobsterScrollArea';

export default function InventoryView({ inventory = [], api }) {
  const [activeTab, setActiveTab] = useState('shop'); // shop, giveaway, personal, bundles
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showBundleBuilder, setShowBundleBuilder] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [bundleItems, setBundleItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [stats, setStats] = useState({ shop: 0, giveaway: 0, personal: 0, bundles: 0 });
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({ name: '', sku: '', qty: 0, price: '', category: 'shop', notes: '' });

  // Fetch all inventory on mount
  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory/all');
      const data = await res.json();
      setAllItems(data.items || []);
      setStats(data.stats || { shop: 0, giveaway: 0, personal: 0, bundles: 0 });
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
      setLoading(false);
    }
  };

  // Filter items based on tab and search
  // Supabase items use 'type' field for shop/giveaway/personal, 'category' for product category (apparel, etc.)
  const filteredItems = allItems.filter(item => {
    const itemType = item.type || item.category || 'shop'; // fallback chain
    const matchesTab = activeTab === 'shop'
      ? (itemType === 'shop' || itemType === 'apparel' || !item.type)  // shop is default
      : itemType === activeTab;
    const matchesSearch = !searchQuery ||
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });


  // Use fetched stats
  const displayStats = stats || { shop: 0, giveaway: 0, personal: 0, bundles: 0 };

  const addToBundle = (item) => {
    setBundleItems([...bundleItems, item]);
  };

  const removeFromBundle = (index) => {
    setBundleItems(bundleItems.filter((_, i) => i !== index));
  };

  const handleAddItem = async () => {
    if (!newItem.name) return;
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
      const data = await res.json();
      if (data.success && data.item) {
        setAllItems(prev => [data.item, ...prev]);
        setStats(prev => ({ ...prev, shop: prev.shop + 1 }));
        if (api?.toast) api.toast('Item Added', `${newItem.name} has been added to inventory.`, 'success');
      } else {
        throw new Error(data.error || 'Failed to add item');
      }
      setNewItem({ name: '', sku: '', qty: 0, price: '', category: 'shop', notes: '' });
      setShowAddModal(false);
      fetchInventory();
    } catch (e) {
      console.error('Failed to add item:', e);
      if (api?.toast) api.toast('Failed to add item', e.message, 'error');
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setAllItems(prev => prev.filter(i => i.id !== id));
      if (api?.toast) api.toast('Item Deleted', 'Inventory unit removed', 'success');
      fetchInventory();
    } catch (e) {
      console.error('Failed to delete item:', e);
      if (api?.toast) api.toast('Failed to delete item', e.message, 'error');
    }
  };

  const handleUpdateQty = async (id, delta) => {
    const item = allItems.find(i => i.id === id);
    if (!item) return;
    const newQty = Math.max(0, (item.qty || 0) + delta);
    try {
      const res = await fetch(`/api/inventory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qty: newQty })
      });
      if (!res.ok) throw new Error('Update failed');
      setAllItems(prev => prev.map(i => i.id === id ? { ...i, qty: newQty } : i));
      if (api?.toast) api.toast('Quantity Updated', `Stock for ${item.name} is now ${newQty}`, 'success');
      fetchInventory();
    } catch (e) {
      console.error('Failed to update qty:', e);
      if (api?.toast) api.toast('Update Failed', e.message, 'error');
    }
  };

  const getStockStatus = (qty) => {
    if (qty === 0) return { label: 'Out of Stock', color: '#ef4444' };
    if (qty <= 5) return { label: 'Low Stock', color: '#f59e0b' };
    if (qty <= 10) return { label: 'Limited', color: '#f59e0b' };
    return { label: 'In Stock', color: '#10b981' };
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.2rem', opacity: 0.7 }}>Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 min-h-[70vh] animate-in-fade-slide">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: ShoppingBag, label: 'Shop Inventory', value: displayStats.shop, sub: 'units for sale', color: 'text-blue-400', glass: 'bg-blue-500/5 border-blue-500/20' },
          { icon: Gift, label: 'Giveaway Freq', value: displayStats.giveaway, sub: 'community rewards', color: 'text-amber-400', glass: 'bg-amber-500/5 border-amber-500/20' },
          { icon: Archive, label: 'Archive Stock', value: displayStats.personal, sub: 'private collection', color: 'text-violet-400', glass: 'bg-violet-500/5 border-violet-500/20' },
          { icon: Box, label: 'Mystery Packs', value: displayStats.bundles, sub: 'click to deploy', color: 'text-emerald-400', glass: 'bg-emerald-500/5 border-emerald-500/20', action: () => setShowBundleBuilder(true) }
        ].map((stat, i) => (
          <WidgetCard
            key={i}
            className={`p-6 transition-all duration-500 group cursor-pointer ${stat.glass} hover:scale-[1.02] active:scale-95`}
            onClick={stat.action}
          >
            <div className="flex items-center gap-3 mb-4">
              <stat.icon size={18} className={`${stat.color} group-hover:scale-110 transition-transform`} />
              <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">{stat.label}</span>
            </div>
            <div className="text-3xl font-black text-white font-premium tracking-tighter mb-1">{stat.value}</div>
            <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">{stat.sub}</div>
          </WidgetCard>
        ))}
      </div>

      {/* Navigation & Search */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center pb-8 border-b border-white/5">
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 shrink-0">
          {[
            { id: 'shop', label: 'Commercial', icon: ShoppingBag },
            { id: 'giveaway', label: 'Community', icon: Gift },
            { id: 'personal', label: 'Vault', icon: Archive },
            { id: 'bundles', label: 'Matrix', icon: Box }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2.5
                ${activeTab === tab.id ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'text-gray-500 hover:text-white'}
              `}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 w-full flex gap-4">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-amber-500 transition-colors" size={16} />
            <input
              type="text"
              placeholder="SCAN SIGNAL BY NAME OR SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-3.5 text-xs text-white font-bold tracking-widest outline-none focus:border-amber-500/50 transition-all placeholder:text-gray-700"
            />
          </div>
          <GlassyPill variant="primary" className="!px-8 !py-3.5 shrink-0 cursor-pointer" onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Register Unit</span>
          </GlassyPill>
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {filteredItems.map(item => {
          const status = getStockStatus(item.qty || 0);
          const isSelected = selectedItem?.id === item.id;

          return (
            <WidgetCard
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={`p-6 transition-all duration-500 cursor-pointer group/card relative overflow-hidden
                ${isSelected ? 'border-amber-500/40 ring-1 ring-amber-500/20 shadow-[0_0_40px_rgba(245,158,11,0.05)] bg-white/[0.04]' : 'border-white/5 hover:border-white/10 hover:bg-white/[0.02]'}
              `}
            >
              {isSelected && <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500/50 glow-amber-sm"></div>}

              // Product image
              {(item.image || item.image_url) && (
                <div className="w-full h-32 mb-4 rounded-xl overflow-hidden bg-black/40 flex items-center justify-center">
                  <img
                    src={item.image || item.image_url}
                    alt={item.name}
                    className="w-full h-full object-contain p-2"
                  />
                </div>
              )}

              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                  <div className="text-[11px] font-black text-white group-hover/card:text-amber-500 transition-colors uppercase tracking-tight">
                    {item.name}
                  </div>
                  <div className="text-[9px] font-mono text-gray-600">ID://{item.sku}</div>
                </div>
                <div
                  className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border"
                  style={{
                    borderColor: status.color + '40',
                    color: status.color,
                    background: status.color + '10'
                  }}
                >
                  {status.label}
                </div>
              </div>

              <div className="flex justify-between items-end mb-6">
                <div className="space-y-1">
                  <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Stock Level</div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleUpdateQty(item.id, -1); }} className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-red-400 hover:border-red-500/30 transition-all"><Minus size={10} /></button>
                    <div className={`text-2xl font-black font-premium ${item.qty > 0 ? 'text-white' : 'text-red-500/50'}`}>
                      {item.qty || 0}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleUpdateQty(item.id, 1); }} className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"><Plus size={10} /></button>
                  </div>
                </div>
                {item.price && item.price !== '0.00' && (
                  <div className="text-right">
                    <div className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Value</div>
                    <div className="text-sm font-black text-emerald-400 font-mono">${item.price}</div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-6 pt-4 border-t border-white/5">
                {item.size && (
                  <div className="flex items-center gap-2">
                    <Tag size={10} className="text-gray-600" />
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.size}</span>
                  </div>
                )}
                {item.condition && (
                  <div className="flex items-center gap-2">
                    <Sparkles size={10} className="text-gray-600" />
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.condition}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {activeTab === 'giveaway' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToBundle(item);
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-dashed border-white/10 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] hover:border-amber-500/30 hover:text-amber-500 hover:bg-amber-500/5 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={12} />
                    Stage for Bundle
                  </button>
                )}
                {item.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id); }}
                    className="py-2.5 px-3 rounded-xl border border-red-500/20 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-all opacity-0 group-hover/card:opacity-100"
                    title="Delete item"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </WidgetCard>
          );
        })}

        {filteredItems.length === 0 && !loading && (
          <div className="col-span-full py-24 text-center opacity-30 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-3xl">
            <Box size={40} className="mb-6 opacity-20" />
            <p className="text-sm font-black uppercase tracking-[0.4em]">Sector Deficit: No Units Detected</p>
            <p className="text-[10px] font-bold text-gray-600 mt-2 uppercase tracking-widest">Adjust filters or register new inventory matrix</p>
          </div>
        )}
      </div>

      {/* Bundle Builder Modal */}
      {showBundleBuilder && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in-fade">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowBundleBuilder(false)}></div>
          <WidgetCard className="relative w-full max-w-xl overflow-visible animate-in-slide-up shadow-3xl border-white/10 bg-black/60">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                  <Sparkles size={24} />
                </div>
                <h2 className="text-2xl font-black text-white font-premium tracking-tight uppercase tracking-widest">Bundle Assembly</h2>
              </div>
              <button
                onClick={() => setShowBundleBuilder(false)}
                className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition-all font-light"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Archive Designation</label>
                <input
                  type="text"
                  placeholder="E.G. 'TITAN MYSTERY BOX v1.0'..."
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-bold placeholder:text-gray-700 uppercase tracking-widest"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Matrix Components ({bundleItems.length})</label>
                  <span className="text-[10px] font-mono text-gray-600">SECTOR_GIVEAWAY</span>
                </div>

                <LobsterScrollArea className="min-h-[140px] max-h-[240px]" contentClassName="bg-white/[0.02] border border-dashed border-white/10 rounded-2xl p-4 glass-scroll flex flex-col gap-2">
                  {bundleItems.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-20">
                      <Archive size={24} />
                      <p className="text-[9px] font-black uppercase tracking-widest">Stage giveway units to initiate link</p>
                    </div>
                  ) : (
                    bundleItems.map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-3.5 bg-white/5 border border-white/10 rounded-xl group/item hover:bg-white/10 transition-all">
                        <div className="flex items-center gap-3">
                          <Package size={14} className="text-amber-500/50" />
                          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{item.name}</span>
                        </div>
                        <button
                          onClick={() => removeFromBundle(i)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 opacity-0 group/item-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                        >
                          <Minus size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </LobsterScrollArea>
              </div>

              <GlassyPill variant="primary" className="w-full !py-5 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                <span className="text-xs font-black uppercase tracking-[0.3em]">Initialize Mystery Pack Creation</span>
              </GlassyPill>
            </div>
          </WidgetCard>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in-fade">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowAddModal(false)}></div>
          <WidgetCard className="relative w-full max-w-xl overflow-visible animate-in-slide-up shadow-3xl border-white/10 bg-black/60">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                  <Package size={24} />
                </div>
                <h2 className="text-2xl font-black text-white font-premium tracking-tight uppercase">Register Unit</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Item Name *</label>
                <input type="text" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="E.G. 'GUAPDAD 4000 HOODIE'..." className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-bold placeholder:text-gray-700 uppercase tracking-widest" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">SKU</label>
                  <input type="text" value={newItem.sku} onChange={e => setNewItem({ ...newItem, sku: e.target.value })}
                    placeholder="SKU-001" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-bold placeholder:text-gray-700 uppercase tracking-widest" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Quantity</label>
                  <input type="number" value={newItem.qty} onChange={e => setNewItem({ ...newItem, qty: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-bold" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Price</label>
                  <input type="text" value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                    placeholder="29.99" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-bold placeholder:text-gray-700" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Category</label>
                  <select value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-bold uppercase tracking-widest">
                    <option value="shop">Shop</option>
                    <option value="apparel">Apparel</option>
                    <option value="giveaway">Giveaway</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Notes</label>
                <input type="text" value={newItem.notes} onChange={e => setNewItem({ ...newItem, notes: e.target.value })}
                  placeholder="Optional notes..." className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-amber-500/50 transition-all font-bold placeholder:text-gray-700" />
              </div>
              <GlassyPill variant="primary" className="w-full !py-5 shadow-[0_0_30px_rgba(245,158,11,0.2)] cursor-pointer mt-4" onClick={handleAddItem}>
                <span className="text-xs font-black uppercase tracking-[0.3em]">Register Inventory Unit</span>
              </GlassyPill>
            </div>
          </WidgetCard>
        </div>
      )}
    </div>
  );
}
