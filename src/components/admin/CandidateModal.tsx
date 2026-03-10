import React, { useState, useEffect } from 'react';
import { Loader2, X, Upload } from 'lucide-react';
import api, { getImageUrl } from '@/lib/axios';

interface CandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  candidate?: any | null;
}

export default function CandidateModal({ isOpen, onClose, onSuccess, candidate }: CandidateModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [biography, setBio] = useState('');
  const [facultyCode, setFacultyCode] = useState('');
  const [isNoVote, setIsNoVote] = useState(false);
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [facultiesList, setFacultiesList] = useState<any[]>([]);

  useEffect(() => {
    if (candidate && isOpen) {
      setName(candidate.name || '');
      setPosition(candidate.position || '');
      setBio(candidate.biography || '');
      setFacultyCode(candidate.faculty_code || '');
      setIsNoVote(candidate.is_no_vote || false);
      setDisplayOrder(candidate.display_order ?? 0);
      setPreviewUrl(candidate.image_url ? getImageUrl(candidate.image_url) : '');
    } else {
      resetForm();
    }

    if (isOpen && facultiesList.length === 0) {
      const fetchFaculties = async () => {
        try {
          const res = await api.get('/admin/faculties');
          setFacultiesList(res.data);
        } catch (err) {
          console.error('Failed to fetch faculties', err);
        }
      };
      fetchFaculties();
    }
  }, [candidate, isOpen, facultiesList.length]);

  const resetForm = () => {
    setName('');
    setPosition('');
    setBio('');
    setFacultyCode('');
    setIsNoVote(false);
    setDisplayOrder(0);
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

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('position', position);
      formData.append('biography', biography);
      if (facultyCode) formData.append('faculty_code', facultyCode);
      formData.append('is_no_vote', String(isNoVote));
      formData.append('display_order', String(displayOrder));
      
      if (file) {
        formData.append('image', file);
      }

      if (candidate?.id) {
        await api.put(`/candidates/${candidate.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/candidates', formData, {
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
          {candidate ? 'Edit Candidate' : 'Add New Candidate'}
        </h2>

        {error && (
          <div className="mb-6 bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-4">
             <div className="relative">
                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 group">
                   {previewUrl ? (
                     <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                   ) : (
                     <div className="flex flex-col items-center mt-2">
                       <Upload className="w-6 h-6 text-gray-400 mb-1" />
                     </div>
                   )}
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <span className="text-xs font-medium text-white">Upload</span>
                   </div>
                   <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-[0px]" onChange={handleImageChange} />
                </div>
             </div>
             <p className="text-xs text-gray-500">JPG, PNG or WEBP. Max 5MB.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <label className="text-sm font-semibold text-gray-700">Full Name</label>
              <input required type="text" value={name} onChange={e => setName(e.target.value)} className="text-black w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border outline-none" placeholder="e.g. John Doe" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Position / Title (Optional)</label>
              <input type="text" value={position} onChange={e => setPosition(e.target.value)} className="text-black w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border outline-none" placeholder="e.g. Presidential Candidate" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700">Faculty (Optional)</label>
              <select 
                value={facultyCode} 
                onChange={e => setFacultyCode(e.target.value)} 
                className="text-black w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border outline-none bg-white"
              >
                <option value="">-- No Faculty / University Wide --</option>
                {facultiesList.map((fac) => (
                  <option key={fac.faculty_code} value={fac.faculty_code}>
                     ({fac.faculty_code}) {fac.faculty_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="col-span-2 flex flex-col justify-start">
              <label className="flex items-center gap-2 cursor-pointer p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                <input type="checkbox" checked={isNoVote} onChange={e => setIsNoVote(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded cursor-pointer" />
                <div>
                   <p className="text-sm font-bold text-gray-800">No Vote (Abstain) Candidate</p>
                   <p className="text-xs text-gray-500">Check this if this candidate represents the "ไม่ประสงค์ลงคะแนน" option.</p>
                </div>
              </label>
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-sm font-semibold text-gray-700">Biography / Policy Statement (Optional)</label>
              <textarea rows={4} value={biography} onChange={e => setBio(e.target.value)} className="text-black w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border outline-none resize-none" placeholder="Brief description of the candidate's agenda..." />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-sm font-semibold text-gray-700">Sort Order (Optional)</label>
              <input type="number" min="0" value={displayOrder} onChange={e => setDisplayOrder(parseInt(e.target.value) || 0)} className="text-black w-full rounded-xl border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2 border outline-none" placeholder="0 = Default, 1 = First, 2 = Second..." />
              <p className="text-xs text-gray-500">Determines the rendering position on the vote page. Lower numbers appear first. "No Vote" is always locked at the end.</p>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition">
              Cancel
            </button>
            <button disabled={loading} type="submit" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all active:scale-95">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {candidate ? 'Save Changes' : 'Create Candidate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
