import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Plus, Trash2, Image as ImageIcon, Link as LinkIcon, Award, User, AlertCircle, Save, ArrowLeft, GraduationCap, BookOpen, Upload, FileCheck, X } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';
import { Department, SocialLink, Achievement, Student, SemesterCGPA, Course } from '../types';
import { api } from '../services/mockDb';

const EditProfile: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<Student | null>(null);

  // Form State
  const [basicInfo, setBasicInfo] = useState({
    fullName: '',
    department: Department.MT,
    intake: '',
    bio: '',
    email: '',
  });

  const [media, setMedia] = useState({
    avatarUrl: '', 
    galleryImages: [''], 
  });

  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [achievements, setAchievements] = useState<Partial<Achievement>[]>([]);
  const [courses, setCourses] = useState<Partial<Course>[]>([]);
  const [cgpa, setCgpa] = useState<SemesterCGPA[]>(
      Array.from({ length: 8 }, (_, i) => ({ semester: i + 1, gpa: '' }))
  );

  useEffect(() => {
      const fetchStudent = async () => {
          if(!slug) return;
          const data = await api.getStudentBySlug(slug);
          if (data) {
              if (data.isLocked) {
                  alert("This profile is secured and cannot be edited. Contact an admin.");
                  navigate(`/directory/${slug}`);
                  return;
              }
              setStudent(data);
              setBasicInfo({
                  fullName: data.fullName,
                  department: data.department,
                  intake: data.intake,
                  bio: data.bio,
                  email: data.contactEmail || ''
              });
              setMedia({
                  avatarUrl: data.avatarUrl,
                  galleryImages: data.galleryImages.length > 0 ? data.galleryImages : ['']
              });
              setSocials(data.socialLinks);
              setAchievements(data.achievements);
              
              if (data.courses) setCourses(data.courses);
              
              if (data.cgpa && data.cgpa.length > 0) {
                  const mergedCgpa = Array.from({ length: 8 }, (_, i) => {
                      const found = data.cgpa.find(c => c.semester === i + 1);
                      return found ? found : { semester: i + 1, gpa: '' };
                  });
                  setCgpa(mergedCgpa);
              }
          }
          setLoading(false);
      };
      fetchStudent();
  }, [slug, navigate]);

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

  const handleCgpaChange = (index: number, value: string) => {
      if (value !== '' && !/^\d*\.?\d*$/.test(value)) return;
      if (parseFloat(value) > 4.0) return; 
      
      setCgpa(prev => {
          const newCgpa = [...prev];
          newCgpa[index] = { ...newCgpa[index], gpa: value };
          return newCgpa;
      });
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'gallery' | 'courseCert' | 'achievementCert', index?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Standardized to 15MB
    if (file.size > 15 * 1024 * 1024) {
      alert("File is too large. Max 15MB allowed.");
      return;
    }

    try {
      const base64 = await readFileAsBase64(file);
      
      if (type === 'avatar') {
        setMedia(prev => ({ ...prev, avatarUrl: base64 }));
      } else if (type === 'gallery' && typeof index === 'number') {
        setMedia(prev => {
          const newGallery = [...prev.galleryImages];
          newGallery[index] = base64;
          return { ...prev, galleryImages: newGallery };
        });
      } else if (type === 'courseCert' && typeof index === 'number') {
          setCourses(prev => {
              const newCourses = [...prev];
              newCourses[index] = { ...newCourses[index], certificateUrl: base64 };
              return newCourses;
          });
      } else if (type === 'achievementCert' && typeof index === 'number') {
          setAchievements(prev => {
              const newAch = [...prev];
              newAch[index] = { ...newAch[index], attachmentUrl: base64 };
              return newAch;
          });
      }
    } catch (err) {
      console.error("Error reading file", err);
      alert("Failed to process file.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!student) return;

    setIsSubmitting(true);
    setError(null);

    try {
        const cleanGallery = media.galleryImages.filter(img => img.trim() !== '');
        const cleanSocials = socials.filter(s => s.url.trim() !== '');
        const cleanAchievements = achievements.filter(a => a.title?.trim() !== '') as Achievement[];
        const cleanCourses = courses.filter(c => c.title?.trim() !== '') as Course[];
        const cleanCgpa = cgpa.filter(c => c.gpa !== '');

        await api.updateStudent(student.id, {
            fullName: basicInfo.fullName,
            department: basicInfo.department,
            intake: basicInfo.intake,
            bio: basicInfo.bio,
            contactEmail: basicInfo.email,
            avatarUrl: media.avatarUrl,
            galleryImages: cleanGallery,
            socialLinks: cleanSocials,
            achievements: cleanAchievements,
            courses: cleanCourses,
            cgpa: cleanCgpa,
            isLocked: true 
        });

        alert("Profile updated successfully! It is now secured.");
        navigate(`/directory/${student.slug}`);

    } catch (err: any) {
        console.error("Update error:", err);
        setError(err.message || "An error occurred.");
    } finally {
        setIsSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (!student) return <div className="text-center py-20">Student not found</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
            <p className="mt-2 text-gray-600">Update your student profile information.</p>
        </div>
        <Button variant="secondary" onClick={() => navigate(`/directory/${student.slug}`)}>
            <ArrowLeft className="w-4 h-4 mr-2"/> Cancel
        </Button>
      </div>

      <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
        {error && (
            <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start text-red-700 text-sm">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                <div>
                    <p className="font-bold">Update Failed</p>
                    <p>{error}</p>
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
                            className="block w-full rounded-md border-gray-600 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2 bg-gray-800 text-white"
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
                    <Input 
                        label="Contact Email (Public)" 
                        type="email" 
                        required 
                        value={basicInfo.email} 
                        onChange={(e) => setBasicInfo({...basicInfo, email: e.target.value})} 
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Biography</label>
                    <textarea
                        rows={4}
                        className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-white"
                        required
                        value={basicInfo.bio}
                        onChange={(e) => setBasicInfo({ ...basicInfo, bio: e.target.value })}
                    />
                </div>
            </div>

            {/* CGPA */}
            <div className="space-y-4">
                 <h3 className="text-lg font-medium text-gray-900 border-b pb-2 flex items-center">
                    <GraduationCap className="w-5 h-5 mr-2 text-gray-500"/> Academic Results (CGPA)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {cgpa.map((sem, idx) => (
                        <div key={idx}>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Semester {sem.semester}</label>
                            <input
                                type="text"
                                placeholder="0.00"
                                className="block w-full rounded-md border-gray-600 shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm border p-2 text-center bg-gray-800 text-white"
                                value={sem.gpa}
                                onChange={(e) => handleCgpaChange(idx, e.target.value)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Courses */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 flex items-center">
                    <BookOpen className="w-5 h-5 mr-2 text-gray-500"/> Courses & Certifications
                </h3>
                
                {courses.map((course, idx) => (
                     <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-2 relative">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            <Input
                                placeholder="Course Title"
                                value={course.title}
                                onChange={(e) => handleArrayChange(setCourses, idx, 'title', e.target.value)}
                            />
                            <Input
                                placeholder="Provider (e.g. Coursera)"
                                value={course.provider}
                                onChange={(e) => handleArrayChange(setCourses, idx, 'provider', e.target.value)}
                            />
                         </div>
                         <div className="grid grid-cols-2 gap-3 mb-3">
                             <div>
                                 <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                                 <input
                                    type="date"
                                    className="w-full rounded-md border-gray-600 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2 bg-gray-800 text-white"
                                    value={course.startDate}
                                    onChange={(e) => handleArrayChange(setCourses, idx, 'startDate', e.target.value)}
                                 />
                             </div>
                             <div>
                                 <label className="block text-xs text-gray-500 mb-1">End Date</label>
                                 <input
                                    type="date"
                                    className="w-full rounded-md border-gray-600 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2 bg-gray-800 text-white"
                                    value={course.endDate}
                                    onChange={(e) => handleArrayChange(setCourses, idx, 'endDate', e.target.value)}
                                 />
                             </div>
                         </div>
                         
                         <div>
                             <label className="block text-xs font-medium text-gray-500 mb-1">Certificate (PDF/JPG, Max 15MB)</label>
                             <input 
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-white file:text-blue-700 hover:file:bg-blue-50 border rounded p-1"
                                onChange={(e) => handleFileChange(e, 'courseCert', idx)}
                             />
                             {course.certificateUrl && <p className="text-xs text-green-600 mt-1">File Attached</p>}
                         </div>

                         <button type="button" onClick={() => handleRemoveRow(setCourses, idx)} className="absolute top-2 right-2 text-red-500 hover:text-red-700">
                            <Trash2 size={16} />
                         </button>
                     </div>
                ))}
                <button 
                    type="button" 
                    onClick={() => handleAddRow(setCourses, { title: '', provider: '', startDate: '', endDate: '', certificateUrl: '' })}
                    className="text-sm text-blue-600 font-medium flex items-center"
                >
                    <Plus size={16} className="mr-1"/> Add Course
                </button>
            </div>

            {/* 2. Media Uploads */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 flex items-center">
                    <ImageIcon className="w-5 h-5 mr-2 text-gray-500"/> Profile Images
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture (Max 15MB)</label>
                  <input 
                    type="file"
                    accept="image/*"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    onChange={(e) => handleFileChange(e, 'avatar')}
                  />
                  {media.avatarUrl && (
                    <div className="mt-2">
                        <span className="text-xs text-gray-500 block mb-1">Current Preview:</span>
                        <img src={media.avatarUrl} alt="Preview" className="h-16 w-16 rounded-full object-cover border" />
                    </div>
                  )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gallery Images (Max 15MB each)</label>
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

            {/* 3. Social Links */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 flex items-center">
                    <LinkIcon className="w-5 h-5 mr-2 text-gray-500"/> Social Links
                </h3>
                
                {socials.map((social, idx) => (
                     <div key={idx} className="flex gap-2 mb-2 items-start">
                         <select
                            className="w-1/3 rounded-md border-gray-600 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2 bg-gray-800 text-white"
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
                            className="flex-1 rounded-md border-gray-600 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2 bg-gray-800 text-white"
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

             {/* 4. Achievements */}
             <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 flex items-center">
                    <Award className="w-6 h-6 mr-2 text-yellow-500"/> Achievements & Awards
                </h3>
                
                {achievements.map((ach, idx) => (
                         <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 relative shadow-sm">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                <input
                                    type="text"
                                    placeholder="Award Title (e.g. Dean's List)"
                                    className="rounded-lg border-gray-600 shadow-sm focus:ring-2 focus:ring-blue-500 sm:text-sm border p-2.5 bg-gray-800 text-white transition-all"
                                    value={ach.title}
                                    onChange={(e) => handleArrayChange(setAchievements, idx, 'title', e.target.value)}
                                />
                                <input
                                    type="date"
                                    className="rounded-lg border-gray-600 shadow-sm focus:ring-2 focus:ring-blue-500 sm:text-sm border p-2.5 bg-gray-800 text-white transition-all"
                                    value={ach.date}
                                    onChange={(e) => handleArrayChange(setAchievements, idx, 'date', e.target.value)}
                                />
                             </div>
                             <textarea
                                rows={2}
                                placeholder="Brief description of the achievement..."
                                className="w-full rounded-lg border-gray-600 shadow-sm focus:ring-2 focus:ring-blue-500 sm:text-sm border p-2.5 bg-gray-800 text-white mb-3 transition-all"
                                value={ach.description}
                                onChange={(e) => handleArrayChange(setAchievements, idx, 'description', e.target.value)}
                             />
                             
                             <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                 <div className="flex-grow">
                                     <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Archive Verification (Image/PDF, Max 15MB)</label>
                                     <div className="relative group">
                                         <label className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border-2 border-dashed cursor-pointer transition-all ${ach.attachmentUrl ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50'}`}>
                                             {ach.attachmentUrl ? <FileCheck className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                                             <span className="text-xs font-bold uppercase tracking-tight">
                                                 {ach.attachmentUrl ? 'Document Attached' : 'Choose Verification File'}
                                             </span>
                                             <input 
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                className="hidden"
                                                onChange={(e) => handleFileChange(e, 'achievementCert', idx)}
                                             />
                                         </label>
                                         {ach.attachmentUrl && (
                                             <button 
                                                type="button" 
                                                onClick={() => handleArrayChange(setAchievements, idx, 'attachmentUrl', '')}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:scale-110 transition-transform"
                                             >
                                                <X size={12}/>
                                             </button>
                                         )}
                                     </div>
                                 </div>
                             </div>

                             <button type="button" onClick={() => handleRemoveRow(setAchievements, idx)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors p-1">
                                <Trash2 size={16} />
                             </button>
                         </div>
                ))}
                <button 
                    type="button" 
                    onClick={() => handleAddRow(setAchievements, { title: '', date: '', description: '', attachmentUrl: '' })}
                    className="text-sm text-blue-600 font-bold flex items-center hover:text-blue-700 transition-colors"
                >
                    <Plus size={16} className="mr-1"/> Add Achievement
                </button>
            </div>

            <div className="pt-6 border-t border-gray-100">
                <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
                    <Save className="w-4 h-4 mr-2" /> Save Profile Changes
                </Button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;