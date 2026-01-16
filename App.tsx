import React, { useState } from 'react';
import { Sparkles, Layout, Instagram, ExternalLink } from 'lucide-react';

export default function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>🌿 TBH Plant Inventory</h1>
      <p>Your inventory is loading... check back soon!</p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <Instagram size={24} />
        <ExternalLink size={24} />
      </div>
    </div>
  );
}
