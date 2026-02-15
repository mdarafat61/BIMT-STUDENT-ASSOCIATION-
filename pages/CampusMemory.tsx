import React, { useEffect, useState } from 'react';
import { api } from '../services/mockDb';
import { CampusMemory } from '../types';
import { Calendar, Image as ImageIcon, ZoomIn, ZoomOut, X, ChevronLeft, ChevronRight, RotateCcw, AlertCircle } from 'lucide-react';
import Button from '../components/Button';

const CampusMemoryPage: React.FC = () => {
  const [memories, setMemories] = useState<CampusMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ images: string[], index: number } | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const fetchMemories = async () => {
      try {
        setLoading(true);
        const data = await api.getMemories();
        setMemories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load memories", err);
        setError("Unable to travel through time right now. Please check back later.");
      } finally {
        setLoading(false);
      }
    };
    fetchMemories();
  }, []);

  // Safe grouping logic with exhaustive null checks
  const groupedMemories = (memories || []).reduce((acc, memory) => {
    if (!memory || !memory.year) return acc;
    const year = memory.year;
    if (!acc[year]) acc[year] = [];
    acc[year].push(memory);
    return acc;
  }, {} as Record<number, CampusMemory[]>);

  const sortedYears = Object.keys(groupedMemories).map(Number).sort((a, b) => b - a);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImage?.images && selectedImage.images.length > 0) {
      setSelectedImage({
        ...selectedImage,
        index: (selectedImage.index + 1) % selectedImage.images.length
      });
      setZoom(1);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImage?.images && selectedImage.images.length > 0) {
      setSelectedImage({
        ...selectedImage,
        index: (selectedImage.index - 1 + selectedImage.images.length) % selectedImage.images.length
      });
      setZoom(1);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-500 font-medium tracking-tight">Accessing Campus Archives...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Chronicle Error</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry Sync</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight sm:text-5xl">Campus Memories</h1>
        <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
          A visual journey through the heritage of BIMT. Preserving the moments that built our legacy.
        </p>
      </div>

      {selectedImage?.images && selectedImage.images.length > 0 && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center select-none backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <div className="absolute top-6 right-6 flex items-center space-x-3">
             <div className="flex bg-white/10 backdrop-blur-md rounded-xl p-1 border border-white/10" onClick={e => e.stopPropagation()}>
                <button onClick={() => setZoom(prev => Math.min(prev + 0.5, 4))} className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"><ZoomIn size={20} /></button>
                <button onClick={() => setZoom(prev => Math.max(prev - 0.5, 1))} className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"><ZoomOut size={20} /></button>
                <button onClick={() => setZoom(1)} className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"><RotateCcw size={20} /></button>
             </div>
             <button onClick={() => setSelectedImage(null)} className="p-2.5 bg-white/10 text-white hover:bg-red-500 rounded-xl transition-all border border-white/10"><X size={24} /></button>
          </div>

          <button onClick={handlePrev} className="absolute left-4 md:left-8 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all group">
            <ChevronLeft size={40} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          
          <div className="relative max-w-[90vw] max-h-[85vh] overflow-hidden rounded-2xl" onClick={e => e.stopPropagation()}>
             <img 
                src={selectedImage.images[selectedImage.index]} 
                alt="Archive Moment" 
                className="transition-transform duration-300 ease-out cursor-default"
                style={{ transform: `scale(${zoom})`, objectFit: 'contain', maxHeight: '85vh' }}
             />
          </div>

          <button onClick={handleNext} className="absolute right-4 md:right-8 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all group">
            <ChevronRight size={40} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="absolute bottom-6 text-white text-[10px] font-black uppercase tracking-[0.2em] bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10">
            Image {selectedImage.index + 1} / {selectedImage.images.length}
          </div>
        </div>
      )}

      <div className="space-y-32">
        {sortedYears.length > 0 ? sortedYears.map(year => (
          <section key={year} className="relative">
            <div className="flex items-center mb-12">
               <div className="bg-gray-900 text-white px-8 py-3 rounded-2xl text-3xl font-black shadow-2xl tracking-tighter transform -rotate-2">{year}</div>
               <div className="ml-8 h-px bg-gradient-to-r from-gray-200 to-transparent flex-1"></div>
            </div>

            <div className="space-y-24">
               {groupedMemories[year].map(memory => (
                 <div key={memory.id} className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    <div className="lg:col-span-4 lg:sticky lg:top-24 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex items-center text-blue-600 text-[10px] font-black uppercase tracking-widest mb-4">
                           <Calendar className="w-3.5 h-3.5 mr-2" />
                           {memory.date ? new Date(memory.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'Archive Date Unknown'}
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-4 leading-tight">{memory.title}</h3>
                        <p className="text-gray-600 leading-relaxed text-sm mb-6">{memory.description}</p>
                        <div className="flex items-center text-gray-400 text-[10px] font-bold uppercase tracking-[0.15em] border-t border-gray-50 pt-6">
                            <ImageIcon className="w-3.5 h-3.5 mr-2" /> {memory.images?.length || 0} Snapshots
                        </div>
                    </div>

                    <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {(memory.images || []).map((img, idx) => (
                           <div 
                              key={idx} 
                              onClick={() => setSelectedImage({ images: memory.images, index: idx })}
                              className={`relative overflow-hidden rounded-2xl cursor-zoom-in group shadow-sm hover:shadow-2xl transition-all duration-700 ${idx === 0 ? 'col-span-2 row-span-2 aspect-[4/3] sm:aspect-auto sm:h-[450px]' : 'aspect-square'}`}
                            >
                              <img src={img} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" loading="lazy" alt="" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-blue-900/10 transition-colors flex items-center justify-center">
                                 <div className="bg-white/20 backdrop-blur-xl p-4 rounded-2xl opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 border border-white/30">
                                    <ZoomIn className="text-white w-6 h-6" />
                                 </div>
                              </div>
                           </div>
                        ))}
                    </div>
                 </div>
               ))}
            </div>
          </section>
        )) : (
          <div className="text-center py-32 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
             <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                <ImageIcon className="w-10 h-10 text-gray-200" />
             </div>
             <p className="text-gray-500 text-lg font-medium tracking-tight">The archives are currently empty.</p>
             <p className="text-gray-400 text-sm mt-2">Check back soon for historical updates.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampusMemoryPage;