
import React, { useEffect, useState } from 'react';
import { api } from '../services/mockDb';
import { CampusMemory } from '../types';
import { Calendar, Image as ImageIcon, ZoomIn, ZoomOut, X, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

const CampusMemoryPage: React.FC = () => {
  const [memories, setMemories] = useState<CampusMemory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<{ images: string[], index: number } | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const fetchMemories = async () => {
      const data = await api.getMemories();
      setMemories(data);
      setLoading(false);
    };
    fetchMemories();
  }, []);

  // Group memories by year
  const groupedMemories = memories.reduce((acc, memory) => {
    if (!acc[memory.year]) acc[memory.year] = [];
    acc[memory.year].push(memory);
    return acc;
  }, {} as Record<number, CampusMemory[]>);

  const sortedYears = Object.keys(groupedMemories).map(Number).sort((a, b) => b - a);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImage) {
      setSelectedImage({
        ...selectedImage,
        index: (selectedImage.index + 1) % selectedImage.images.length
      });
      setZoom(1);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedImage) {
      setSelectedImage({
        ...selectedImage,
        index: (selectedImage.index - 1 + selectedImage.images.length) % selectedImage.images.length
      });
      setZoom(1);
    }
  };

  if (loading) return <div className="p-20 text-center text-gray-500">Chronicle loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">Campus Memories</h1>
        <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto">
          A timeless journey through BIMT history. Relive the moments that defined our association.
        </p>
      </div>

      {/* Lightbox with Zoom */}
      {selectedImage && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center select-none" onClick={() => setSelectedImage(null)}>
          <div className="absolute top-6 right-6 flex items-center space-x-4">
             <div className="flex bg-white/10 rounded-lg p-1" onClick={e => e.stopPropagation()}>
                <button onClick={() => setZoom(prev => Math.min(prev + 0.5, 4))} className="p-2 text-white hover:bg-white/10 rounded-md">
                    <ZoomIn size={20} />
                </button>
                <button onClick={() => setZoom(prev => Math.max(prev - 0.5, 1))} className="p-2 text-white hover:bg-white/10 rounded-md">
                    <ZoomOut size={20} />
                </button>
                <button onClick={() => setZoom(1)} className="p-2 text-white hover:bg-white/10 rounded-md">
                    <RotateCcw size={20} />
                </button>
             </div>
             <button onClick={() => setSelectedImage(null)} className="p-2 text-white hover:bg-white/10 rounded-full">
                <X size={28} />
             </button>
          </div>

          <button onClick={handlePrev} className="absolute left-6 p-4 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-all">
            <ChevronLeft size={48} />
          </button>
          
          <div className="relative max-w-[90vw] max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
             <img 
                src={selectedImage.images[selectedImage.index]} 
                alt="Memory" 
                className="transition-transform duration-200 ease-out cursor-grab active:cursor-grabbing"
                style={{ transform: `scale(${zoom})`, objectFit: 'contain', maxHeight: '85vh' }}
             />
          </div>

          <button onClick={handleNext} className="absolute right-6 p-4 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-all">
            <ChevronRight size={48} />
          </button>

          <div className="absolute bottom-6 text-white text-sm bg-black/50 px-4 py-2 rounded-full">
            Image {selectedImage.index + 1} of {selectedImage.images.length}
          </div>
        </div>
      )}

      <div className="space-y-24">
        {sortedYears.map(year => (
          <section key={year} className="relative">
            <div className="flex items-center mb-8">
               <div className="bg-blue-900 text-white px-6 py-2 rounded-full text-2xl font-black shadow-lg">
                  {year}
               </div>
               <div className="ml-6 h-px bg-gray-200 flex-1"></div>
            </div>

            <div className="space-y-16">
               {groupedMemories[year].map(memory => (
                 <div key={memory.id} className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    <div className="lg:col-span-4 sticky top-24">
                        <div className="flex items-center text-blue-600 text-sm font-semibold mb-2">
                           <Calendar className="w-4 h-4 mr-2" />
                           {new Date(memory.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">{memory.title}</h3>
                        <p className="text-gray-600 leading-relaxed">{memory.description}</p>
                        <div className="mt-6 flex items-center text-gray-400 text-xs uppercase tracking-widest">
                            <ImageIcon className="w-3 h-3 mr-2" /> {memory.images.length} Captured Moments
                        </div>
                    </div>

                    <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {memory.images.map((img, idx) => (
                           <div 
                              key={idx} 
                              onClick={() => setSelectedImage({ images: memory.images, index: idx })}
                              className={`relative overflow-hidden rounded-xl cursor-zoom-in group shadow-sm hover:shadow-xl transition-all duration-500 ${idx === 0 ? 'col-span-2 row-span-2 h-[300px] sm:h-[400px]' : 'h-[145px] sm:h-[195px]'}`}
                            >
                              <img 
                                src={img} 
                                alt={memory.title} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                 <div className="bg-white/10 backdrop-blur-md p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
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
        ))}

        {memories.length === 0 && (
          <div className="text-center py-24 bg-gray-50 rounded-3xl border border-dashed">
             <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
             <p className="text-gray-500 text-lg">No memories have been archived yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampusMemoryPage;
