import React, { useState, useEffect } from 'react';
import { 
  Package, Gift, ShoppingBag, Archive, Plus, Minus, 
  Search, Filter, Box, Tag, Truck, Users, Sparkles
} from 'lucide-react';

export default function InventoryView({ inventory = [], api }) {
  const [activeTab, setActiveTab] = useState('shop'); // shop, giveaway, personal, bundles
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showBundleBuilder, setShowBundleBuilder] = useState(false);
  const [bundleItems, setBundleItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [stats, setStats] = useState({ shop: 0, giveaway: 0, personal: 0, bundles: 0 });
  const [loading, setLoading] = useState(true);

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
  const filteredItems = allItems.filter(item => {
    const matchesTab = item.category === activeTab;
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
    <div className="inventory-view" style={{ padding: '20px' }}>
      {/* Header Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div className="stat-card" style={{ 
          background: 'rgba(255,255,255,0.3)', 
          padding: '16px', 
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShoppingBag size={20} color="#3b82f6" />
            <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Shop Items</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{displayStats.shop}</div>
          <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>units for sale</div>
        </div>

        <div className="stat-card" style={{ 
          background: 'rgba(255,255,255,0.3)', 
          padding: '16px', 
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Gift size={20} color="#f59e0b" />
            <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Giveaway</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{displayStats.giveaway}</div>
          <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>for streams & fans</div>
        </div>

        <div className="stat-card" style={{ 
          background: 'rgba(255,255,255,0.3)', 
          padding: '16px', 
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Archive size={20} color="#8b5cf6" />
            <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Personal</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{displayStats.personal}</div>
          <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>your personal stock</div>
        </div>

        <div className="stat-card" style={{ 
          background: 'rgba(255,255,255,0.3)', 
          padding: '16px', 
          borderRadius: '12px',
          border: '1px solid rgba(255,255,255,0.3)',
          cursor: 'pointer'
        }} onClick={() => setShowBundleBuilder(true)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Box size={20} color="#10b981" />
            <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Bundles</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{displayStats.bundles}</div>
          <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>click to build new</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '20px',
        borderBottom: '1px solid rgba(255,255,255,0.3)',
        paddingBottom: '12px'
      }}>
        {[
          { id: 'shop', label: 'Shop Inventory', icon: ShoppingBag },
          { id: 'giveaway', label: 'Giveaway Items', icon: Gift },
          { id: 'personal', label: 'Personal Stock', icon: Archive },
          { id: 'bundles', label: 'Mystery Packs', icon: Box }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab.id ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.6)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.9rem',
              transition: 'all 0.2s'
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '20px' 
      }}>
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '8px',
          padding: '0 12px'
        }}>
          <Search size={18} style={{ opacity: 0.5, marginRight: '8px' }} />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              padding: '12px 0',
              color: 'inherit',
              outline: 'none'
            }}
          />
        </div>
        <button style={{
          padding: '12px 20px',
          borderRadius: '8px',
          border: 'none',
          background: 'rgba(59, 130, 246, 0.8)',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Plus size={16} />
          Add Item
        </button>
      </div>

      {/* Inventory Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {filteredItems.map(item => {
          const status = getStockStatus(item.qty || 0);
          return (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '12px',
                padding: '16px',
                cursor: 'pointer',
                border: selectedItem?.id === item.id ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.3)',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                marginBottom: '12px'
              }}>
                <div style={{ 
                  fontWeight: '600', 
                  fontSize: '0.95rem',
                  lineHeight: 1.3
                }}>
                  {item.name}
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  background: status.color + '20',
                  color: status.color
                }}>
                  {status.label}
                </span>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>SKU: {item.sku}</span>
                <span style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 'bold',
                  color: item.qty > 0 ? '#10b981' : '#ef4444'
                }}>
                  {item.qty || 0}
                </span>
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '8px',
                fontSize: '0.75rem',
                opacity: 0.6
              }}>
                {item.size && <span>Size: {item.size}</span>}
                {item.price && item.price !== '0.00' && <span>Price: ${item.price}</span>}
                {item.category === 'giveaway' && <span style={{color: '#f59e0b'}}>Giveaway</span>}
                {item.condition && <span>Cond: {item.condition}</span>}
              </div>

              {activeTab === 'giveaway' && (
                <div style={{ 
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid rgba(255,255,255,0.3)'
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToBundle(item);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px dashed rgba(255,255,255,0.3)',
                      background: 'transparent',
                      color: 'inherit',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Plus size={14} />
                    Add to Bundle
                  </button>
                </div>
              )}
            </div>
          );
        })}
        
        {filteredItems.length === 0 && !loading && (
          <div style={{
            gridColumn: '1 / -1',
            padding: '60px',
            textAlign: 'center',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '12px',
            border: '1px dashed rgba(255,255,255,0.3)'
          }}>
            <div style={{ fontSize: '1.1rem', opacity: 0.7, marginBottom: '8px' }}>
              No items in {activeTab}
            </div>
            <div style={{ fontSize: '0.85rem', opacity: 0.5 }}>
              {activeTab === 'giveaway' 
                ? 'Add items from the manifest to giveaway inventory' 
                : 'Items will appear here once added to the database'}
            </div>
          </div>
        )}
      </div>

      {/* Bundle Builder Modal */}
      {showBundleBuilder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          zIndex: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px'
        }}>
          <div style={{
            background: 'rgba(30, 30, 30, 0.95)',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Sparkles size={24} color="#f59e0b" />
                Mystery Pack Builder
              </h2>
              <button 
                onClick={() => setShowBundleBuilder(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  fontSize: '1.5rem',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
                Pack Name
              </label>
              <input
                type="text"
                placeholder="e.g., '2XL Mystery Box' or 'Stream Survivor Pack'"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.15)',
                  color: 'inherit',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>
                Items in Pack ({bundleItems.length})
              </label>
              <div style={{ 
                minHeight: '100px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '8px',
                padding: '12px',
                border: '1px dashed rgba(255,255,255,0.2)'
              }}>
                {bundleItems.length === 0 ? (
                  <p style={{ opacity: 0.5, textAlign: 'center', margin: 0 }}>
                    Click "Add to Bundle" on giveaway items to build your pack
                  </p>
                ) : (
                  bundleItems.map((item, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px',
                      background: 'rgba(255,255,255,0.15)',
                      borderRadius: '6px',
                      marginBottom: '8px'
                    }}>
                      <span>{item.name}</span>
                      <button
                        onClick={() => removeFromBundle(i)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer'
                        }}
                      >
                        <Minus size={16} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{
                flex: 1,
                padding: '14px',
                borderRadius: '8px',
                border: 'none',
                background: '#3b82f6',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}>
                Create Mystery Pack
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
