import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Trash2, Bold, Italic, List, ListOrdered, Camera } from 'lucide-react';
import Button from './Button';
import { Condition, Item } from '../types';

interface ItemFormProps {
  initialData?: Item;
  onSubmit: (item: Omit<Item, 'id' | 'interestedParties' | 'createdAt'>) => void;
  onCancel: () => void;
}

const ItemForm: React.FC<ItemFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState<string>('');
  const [condition, setCondition] = useState<Condition>(Condition.GOOD);
  const [description, setDescription] = useState('');
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<(File | string)[]>([]); // Store original files/data URLs
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setPrice(initialData.price.toString());
      setCondition(initialData.condition);
      setDescription(initialData.description || '');
      setImagePreviews(initialData.images);
      if (editorRef.current) {
        editorRef.current.innerHTML = initialData.description || '';
      }
    }
  }, [initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    const newUrls = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newUrls]);
    setImageFiles(prev => [...prev, ...files]); // Store original File objects
  };

  const removeImage = (index: number) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const execCommand = (command: string) => {
    document.execCommand(command, false);
    if (editorRef.current) {
      setDescription(editorRef.current.innerHTML);
    }
  };

  const startCamera = async () => {
    try {
      // Calling getUserMedia here triggers the browser's permission prompt.
      // Since this is only called from the Admin dashboard, friends never see it.
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      // Fallback: If direct camera stream fails, use the native OS camera capture
      cameraInputRef.current?.click();
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImagePreviews(prev => [...prev, dataUrl]);
        setImageFiles(prev => [...prev, dataUrl]); // Store data URL for upload
        stopCamera();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (imagePreviews.length === 0) {
      alert("Please add at least one photo.");
      return;
    }
    // Use imageFiles (File objects or data URLs) instead of just preview URLs
    // This allows the service to upload them properly to Baserow
    onSubmit({
      title,
      price: price === '' ? 0 : Number(price),
      condition,
      description: editorRef.current?.innerHTML || '',
      status: initialData ? initialData.status : 'AVAILABLE',
      images: imageFiles.length > 0 ? imageFiles : imagePreviews, // Prefer files/data URLs over blob URLs
    });
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-stone-200 p-8 md:p-10 animate-fade-in-up">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-black text-stone-900 tracking-tight">
          {initialData ? 'Update item' : 'Add new item'}
        </h2>
        <button 
          onClick={onCancel} 
          className="p-2 text-stone-400 hover:text-stone-900 transition-colors"
          aria-label="Close form"
        >
          <X size={28} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <label className="block text-xs font-black text-stone-400 uppercase tracking-[0.2em]">Photos</label>
          
          {isCameraActive ? (
            <div className="relative rounded-2xl overflow-hidden border-2 border-indigo-500 bg-stone-900 aspect-square sm:aspect-video">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-6">
                <button 
                  type="button" 
                  onClick={stopCamera}
                  className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white hover:bg-white/40 transition-colors"
                >
                  <X size={24} />
                </button>
                <button 
                  type="button" 
                  onClick={capturePhoto}
                  className="rounded-full w-16 h-16 bg-white border-4 border-indigo-500 hover:bg-stone-50 p-1 flex items-center justify-center shadow-2xl"
                  aria-label="Capture photo"
                >
                  <div className="w-full h-full bg-indigo-500 rounded-full" />
                </button>
                <div className="w-12 h-12" /> {/* Spacer */}
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {imagePreviews.map((url, idx) => (
                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-stone-200 group">
                  <img src={url} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => removeImage(idx)} 
                    className="absolute top-2 right-2 bg-rose-500 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove photo"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 aspect-square border-2 border-dashed border-stone-300 rounded-2xl flex flex-col items-center justify-center hover:border-indigo-400 hover:bg-indigo-50 transition-all bg-white group"
                  aria-label="Upload photo from library"
                >
                  <Plus className="w-8 h-8 text-stone-300 group-hover:text-indigo-500 mb-1" />
                  <span className="text-[10px] font-black text-stone-400 group-hover:text-indigo-600 uppercase tracking-widest">Library</span>
                </button>
                <button
                  type="button"
                  onClick={startCamera}
                  className="h-12 border-2 border-stone-200 rounded-xl flex items-center justify-center gap-2 hover:border-indigo-400 hover:bg-indigo-50 transition-all bg-white group"
                  aria-label="Snap live photo"
                >
                  <Camera className="w-4 h-4 text-stone-400 group-hover:text-indigo-500" />
                  <span className="text-[9px] font-black text-stone-400 group-hover:text-indigo-600 uppercase tracking-widest">Live Snap</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Library Picker */}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            multiple 
            onChange={handleFileChange} 
          />
          
          {/* Native Camera Picker (Safe fallback that doesn't trigger browser permissions) */}
          <input 
            type="file" 
            ref={cameraInputRef} 
            className="hidden" 
            accept="image/*" 
            capture="environment" 
            onChange={handleFileChange} 
          />
        </div>

        <div>
          <label htmlFor="item-title" className="block text-xs font-black text-stone-400 uppercase tracking-[0.2em] mb-3">Item Name</label>
          <input
            id="item-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-2xl border-stone-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-5 border-2 text-xl font-bold text-stone-900 placeholder:text-stone-300 bg-white"
            placeholder="e.g. Vintage Chair"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label htmlFor="item-price" className="block text-xs font-black text-stone-400 uppercase tracking-[0.2em] mb-3">Price (€)</label>
            <input
              id="item-price"
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-2xl border-stone-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-5 border-2 font-bold text-stone-900 bg-white"
              placeholder="0 = Free"
            />
          </div>
          <div>
            <label htmlFor="item-condition" className="block text-xs font-black text-stone-400 uppercase tracking-[0.2em] mb-3">Condition</label>
            <select
              id="item-condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value as Condition)}
              className="w-full rounded-2xl border-stone-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-5 border-2 bg-white text-stone-900 font-bold h-[66px]"
            >
              {Object.values(Condition).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-baseline mb-3">
            <label id="description-label" className="block text-xs font-black text-stone-400 uppercase tracking-[0.2em]">Product Description</label>
            <div className="flex gap-1">
              <button 
                type="button" 
                onClick={() => execCommand('bold')} 
                className="p-2 hover:bg-stone-100 rounded-lg text-stone-600 transition-colors"
                title="Bold (Ctrl+B)"
              >
                <Bold size={16} />
              </button>
              <button 
                type="button" 
                onClick={() => execCommand('italic')} 
                className="p-2 hover:bg-stone-100 rounded-lg text-stone-600 transition-colors"
                title="Italic (Ctrl+I)"
              >
                <Italic size={16} />
              </button>
              <button 
                type="button" 
                onClick={() => execCommand('insertUnorderedList')} 
                className="p-2 hover:bg-stone-100 rounded-lg text-stone-600 transition-colors"
                title="Bullet List"
              >
                <List size={16} />
              </button>
              <button 
                type="button" 
                onClick={() => execCommand('insertOrderedList')} 
                className="p-2 hover:bg-stone-100 rounded-lg text-stone-600 transition-colors"
                title="Numbered List"
              >
                <ListOrdered size={16} />
              </button>
            </div>
          </div>
          <div
            ref={editorRef}
            contentEditable
            onInput={() => setDescription(editorRef.current?.innerHTML || '')}
            className="w-full rounded-2xl border-stone-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-5 border-2 font-medium bg-white text-stone-900 leading-relaxed min-h-[200px] outline-none overflow-y-auto"
            role="textbox"
            aria-multiline="true"
            aria-labelledby="description-label"
          />
        </div>

        <div className="pt-4 flex gap-4">
          <Button variant="ghost" type="button" onClick={onCancel} className="flex-1 font-bold py-5 text-stone-400 hover:text-stone-900">Cancel</Button>
          <Button type="submit" className="flex-[2] font-black uppercase tracking-[0.2em] py-5 shadow-2xl shadow-indigo-100">
            {initialData ? 'Save Changes' : 'Post to List'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ItemForm;