import React, { useState, useEffect } from 'react';
import { Loader2, X, Upload } from 'lucide-react';
import api, { getImageUrl } from '@/lib/axios';

interface BannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  banner?: any | null;
}

export default function BannerModal({ isOpen, onClose, onSuccess, banner }: BannerModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayOrder, setDisplayOrder] = useState<number | ''>('');
  const [isActive, setIsActive] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    if (banner && isOpen) {
      setDisplayOrder(banner.display_order !== null ? banner.display_order : '');
      setIsActive(banner.is_active !== undefined ? banner.is_active : true);
      setPreviewUrl(banner.image_url ? getImageUrl(banner.image_url) : '');
    } else {
      resetForm();
    }
  }, [banner, isOpen]);

  const resetForm = () => {
    setDisplayOrder('');
    setIsActive(true);
    setFile(null);
    setPreviewUrl('');
    setError(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // If it's a new banner, a file is required.
    if (!banner && !file) {
      setError('An image file is required to create a new banner.');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      if (displayOrder !== '') formData.append('display_order', String(displayOrder));
      formData.append('is_active', String(isActive));
      
      if (file) {
        formData.append('image', file);
      }

      if (banner?.id) {
        await api.put(`/admin/banners/${banner.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/admin/banners', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Action failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl relative my-8">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition">
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {banner ? 'Edit Banner Slide' : 'Upload New Banner Slide'}
        </h2>

        {error && (
          <div className="mb-6 bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
             <div className="relative w-full aspect-video rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 group">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center mt-2">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-gray-500 font-medium">Click to upload banner</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                   <span className="text-sm font-medium text-white">Change Image</span>
                </div>
                <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-[0px]" onChange={handleImageChange} />
             </div>
             <p className="text-xs text-gray-500">Suggested resolution: 1200x400. JPG, PNG or WEBP. Max 5MB.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <label className="text-sm font-semibold text-gray-700">Display Order (Optional)</label>
              <input type="number" value={displayOrder} onChange={e => setDisplayOrder(e.target.value === '' ? '' : Number(e.target.value))} className="text-black w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border outline-none" placeholder="e.g. 1 (Lowest comes first)" />
            </div>
            
            <div className="col-span-2 flex flex-col justify-start">
              <label className="flex items-center gap-2 cursor-pointer p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded cursor-pointer" />
                <div>
                   <p className="text-sm font-bold text-gray-800">Active</p>
                   <p className="text-xs text-gray-500">Uncheck to hide this banner from the landing page without deleting it.</p>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition">
              Cancel
            </button>
            <button disabled={loading} type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all active:scale-95">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {banner ? 'Save Changes' : 'Upload Banner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
