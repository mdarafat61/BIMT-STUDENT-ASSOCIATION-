
import React, { useState } from 'react';
import { CheckCircle, Plus, Trash2, Image as ImageIcon, Link as LinkIcon, Award, User, Upload, AlertCircle } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';
import { Department, SocialLink, Achievement } from '../types';
import { api } from '../services/mockDb';

const Submit: React.FC = () => {
  const [submissionType, setSubmissionType] = useState<'biography' | 'resource'>('biography');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [basicInfo, setBasicInfo] = useState({
    fullName: '',
    department: Department.MT, // Default to first enum value
    intake: '', // New Intake field
    bio: '',
    email: '',
    resourceTitle: '',
    resourceDesc: '',
  });

  const [media, setMedia] = useState({
    avatarUrl: '', // Will store base64
    galleryImages: [''], // Will store base64 strings
    resourceFile: '' // Will store base64
  });

  const [socials, setSocials] = useState<SocialLink[]>([{ platform: 'linkedin', url: '' }]);
  const [achievements, setAchievements] = useState<Partial<Achievement>[]>([{ title: '', date: '', description: '' }]);

  // Handlers
  const handleAddRow = (setter: React.Dispatch<React.SetStateAction<any[]>>, emptyItem: any) => {
    setter(prev => [...prev, emptyItem]);
  };

  const handleRemoveRow = (setter: React.Dispatch<React.SetStateAction<any[]>>, index: number) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const handleArrayChange = (setter: React.Dispatch<React.SetStateAction<any[]>>, index: number, field: string, value: string) => {
    setter(prev => {
      const newArr = [...prev];
      newArr[index] = { ...newArr[index], [field]: value };
      return newArr;
    });
  };

  // Helper to read file as Base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'resource' | 'gallery', index?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic size check (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Please select a file under 5MB.");
      return;
    }

    try {
      const base64 = await readFileAsBase64(file);
      
      if (type === 'avatar') {
        setMedia(prev => ({ ...prev, avatarUrl: base64 }));
      } else if (type === 'resource') {
        setMedia(prev => ({ ...prev, resourceFile: base64 }));
      } else if (type === 'gallery' && typeof index === 'number') {
        setMedia(prev => {
          const newGallery = [...prev.galleryImages];
          newGallery[index] = base64;
          return { ...prev, galleryImages: newGallery };
        });
      }
    } catch (err) {
      console.error("Error reading file", err);
      alert("Failed to process file.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
        // Clean data
        const cleanGallery = media.galleryImages.filter(img => img.trim() !== '');
        const cleanSocials = socials.filter(s => s.url.trim() !== '');
        const cleanAchievements = achievements.filter(a => a.title?.trim() !== '') as Achievement[];

        const submissionContent = submissionType === 'resource' 
          ? { 
              title: basicInfo.resourceTitle, 
              description: basicInfo.resourceDesc,
              downloadUrl: media.resourceFile, // Using base64 as download link
              intake: basicInfo.intake
            }
          : { 
              bio: basicInfo.bio,
              intake: basicInfo.intake,
              avatarUrl: media.avatarUrl,
              galleryImages: cleanGallery,
              socialLinks: cleanSocials,
              achievements: cleanAchievements,
              contactEmail: basicInfo.email
            };

        await api.createSubmission({
          studentName: basicInfo.fullName,
          department: basicInfo.department,
          type: submissionType,
          content: submissionContent
        });

        setIsSuccess(true);
    } catch (err: any) {
        console.error("Submission error:", err);
        setError(err.message || "An error occurred during submission. Please check your connection or contact admin.");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Submission Received!</h2>
        <p className="text-lg text-gray-600 mb-8">
          Thank you for your contribution. Your submission has been sent to the admin team for review. 
        </p>
        <Button onClick={() => window.location.reload()}>Submit Another</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Student Submission Portal</h1>
        <p className="mt-2 text-gray-600">
          Create your student profile or share academic resources.
        </p>
      </div>

      <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
        {/* Type Selector */}
        <div className="grid grid-cols-2 border-b border-gray-200 bg-gray-50">
           <button 
             type="button"
             onClick={() => setSubmissionType('biography')}
             className={`p-4 text-center font-medium text-sm focus:outline-none ${submissionType === 'biography' ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
           >
             <User className="inline-block w-4 h-4 mr-2" />
             Create Student Profile
           </button>
           <button 
             type="button"
             onClick={() => setSubmissionType('resource')}
             className={`p-4 text-center font-medium text-sm focus:outline-none ${submissionType === 'resource' ? 'bg-white text-blue-600 border-t-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
           >
             <Upload className="inline-block w-4 h-4 mr-2" />
             Share Resource
           </button>
        </div>

        {error && (
            <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <div>
                    <p className="font-bold">Submission Failed</p>
                    <p>{error.includes('row-level security') ? "Database policy violation. The administrator needs to run the setup SQL script." : error}</p>
                </div>
            </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
            
            {/* 1. Basic Information */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                        label="Full Name" 
                        required 
                        value={basicInfo.fullName} 
                        onChange={(e) => setBasicInfo({...basicInfo, fullName: e.target.value})} 
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                        <select
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2"
                            value={basicInfo.department}
                            onChange={(e) => setBasicInfo({ ...basicInfo, department: e.target.value as Department })}
                        >
                            {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Input 
                        label="Intake / Batch" 
                        placeholder="e.g., Batch 25" 
                        required 
                        value={basicInfo.intake} 
                        onChange={(e) => setBasicInfo({...basicInfo, intake: e.target.value})} 
                    />
                </div>
                
                {submissionType === 'biography' && (
                    <>
                        <Input 
                            label="Contact Email (Public)" 
                            type="email" 
                            required 
                            value={basicInfo.email} 
                            onChange={(e) => setBasicInfo({...basicInfo, email: e.target.value})} 
                            helperText="This will be visible on your profile page."
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Biography</label>
                            <textarea
                                rows={4}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Tell us about your academic journey..."
                                required
                                value={basicInfo.bio}
                                onChange={(e) => setBasicInfo({ ...basicInfo, bio: e.target.value })}
                            />
                        </div>
                    </>
                )}

                {submissionType === 'resource' && (
                     <>
                        <Input 
                            label="Resource Title" 
                            required 
                            value={basicInfo.resourceTitle} 
                            onChange={(e) => setBasicInfo({...basicInfo, resourceTitle: e.target.value})} 
                        />
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Upload File (PDF/Doc)</label>
                          <input 
                            type="file" 
                            required 
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            onChange={(e) => handleFileChange(e, 'resource')}
                          />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                rows={3}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                required
                                value={basicInfo.resourceDesc}
                                onChange={(e) => setBasicInfo({ ...basicInfo, resourceDesc: e.target.value })}
                            />
                        </div>
                     </>
                )}
            </div>

            {/* 2. Media Uploads (Profile Only) */}
            {submissionType === 'biography' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2 flex items-center">
                        <ImageIcon className="w-5 h-5 mr-2 text-gray-500"/> Profile Images
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
                      <input 
                        type="file"
                        accept="image/*"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        onChange={(e) => handleFileChange(e, 'avatar')}
                      />
                      {media.avatarUrl && (
                        <img src={media.avatarUrl} alt="Preview" className="mt-2 h-16 w-16 rounded-full object-cover border" />
                      )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images</label>
                        {media.galleryImages.map((img, idx) => (
                            <div key={idx} className="flex gap-2 mb-2 items-center">
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                                  onChange={(e) => handleFileChange(e, 'gallery', idx)}
                                />
                                {img && <img src={img} alt="Preview" className="h-10 w-10 object-cover rounded" />}
                                <button type="button" onClick={() => {
                                    const newImgs = media.galleryImages.filter((_, i) => i !== idx);
                                    setMedia({...media, galleryImages: newImgs});
                                }} className="text-red-500 hover:text-red-700">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                        <button 
                            type="button" 
                            onClick={() => setMedia({...media, galleryImages: [...media.galleryImages, '']})}
                            className="text-sm text-blue-600 font-medium flex items-center mt-2"
                        >
                            <Plus size={16} className="mr-1"/> Add Another Image
                        </button>
                    </div>
                </div>
            )}

            {/* 3. Social Links (Profile Only) */}
            {submissionType === 'biography' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2 flex items-center">
                        <LinkIcon className="w-5 h-5 mr-2 text-gray-500"/> Social Links
                    </h3>
                    
                    {socials.map((social, idx) => (
                         <div key={idx} className="flex gap-2 mb-2 items-start">
                             <select
                                className="w-1/3 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2"
                                value={social.platform}
                                onChange={(e) => handleArrayChange(setSocials, idx, 'platform', e.target.value)}
                             >
                                 <option value="linkedin">LinkedIn</option>
                                 <option value="github">GitHub</option>
                                 <option value="twitter">Twitter</option>
                                 <option value="facebook">Facebook</option>
                                 <option value="instagram">Instagram</option>
                                 <option value="website">Portfolio</option>
                             </select>
                             <input
                                type="text"
                                placeholder="Profile URL"
                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2"
                                value={social.url}
                                onChange={(e) => handleArrayChange(setSocials, idx, 'url', e.target.value)}
                             />
                             <button type="button" onClick={() => handleRemoveRow(setSocials, idx)} className="text-red-500 hover:text-red-700 mt-2">
                                <Trash2 size={18} />
                             </button>
                         </div>
                    ))}
                    <button 
                        type="button" 
                        onClick={() => handleAddRow(setSocials, { platform: 'linkedin', url: '' })}
                        className="text-sm text-blue-600 font-medium flex items-center"
                    >
                        <Plus size={16} className="mr-1"/> Add Social Link
                    </button>
                </div>
            )}

             {/* 4. Achievements (Profile Only) */}
             {submissionType === 'biography' && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2 flex items-center">
                        <Award className="w-5 h-5 mr-2 text-gray-500"/> Achievements & Awards
                    </h3>
                    
                    {achievements.map((ach, idx) => (
                         <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-2 relative">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                                <input
                                    type="text"
                                    placeholder="Award Title (e.g. Dean's List)"
                                    className="rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2"
                                    value={ach.title}
                                    onChange={(e) => handleArrayChange(setAchievements, idx, 'title', e.target.value)}
                                />
                                <input
                                    type="date"
                                    className="rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2"
                                    value={ach.date}
                                    onChange={(e) => handleArrayChange(setAchievements, idx, 'date', e.target.value)}
                                />
                             </div>
                             <textarea
                                rows={2}
                                placeholder="Description"
                                className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2"
                                value={ach.description}
                                onChange={(e) => handleArrayChange(setAchievements, idx, 'description', e.target.value)}
                             />
                             <button type="button" onClick={() => handleRemoveRow(setAchievements, idx)} className="absolute top-2 right-2 text-red-500 hover:text-red-700">
                                <Trash2 size={16} />
                             </button>
                         </div>
                    ))}
                    <button 
                        type="button" 
                        onClick={() => handleAddRow(setAchievements, { title: '', date: '', description: '' })}
                        className="text-sm text-blue-600 font-medium flex items-center"
                    >
                        <Plus size={16} className="mr-1"/> Add Achievement
                    </button>
                </div>
            )}

            <div className="pt-6 border-t border-gray-100">
                <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
                Submit for Review
                </Button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default Submit;
