
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Award, Globe, Github, Linkedin, Twitter, Eye, X, ZoomIn, Mail, Facebook, Instagram, Edit, Unlock, GraduationCap, BookOpen, Download } from 'lucide-react';
import { api } from '../services/mockDb';
import { Student } from '../types';
import Button from '../components/Button';

const StudentProfile: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudent = async () => {
      if (slug) {
        // Increment view count first (fire and forget)
        api.incrementStudentViews(slug).catch(e => console.error(e));
        
        const data = await api.getStudentBySlug(slug);
        setStudent(data || null);
      }
      setLoading(false);
    };
    fetchStudent();
  }, [slug]);

  const handleCertDownload = (url: string, title: string) => {
      if (url.startsWith('data:')) {
         const link = document.createElement('a');
         link.href = url;
         // Attempt to guess extension or default to pdf/jpg based on header
         const mime = url.split(';')[0].split(':')[1];
         let ext = 'pdf';
         if (mime.includes('image')) ext = mime.split('/')[1];
         
         link.download = `${title.replace(/[^a-z0-9]/gi, '_')}_Certificate.${ext}`;
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
      } else {
         window.open(url, '_blank');
      }
  };

  if (loading) return <div className="p-10 text-center">Loading profile...</div>;
  if (!student) return <div className="p-10 text-center">Student not found</div>;

  return (
    <div className="bg-white min-h-screen pb-12">
      {/* Lightbox */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4" onClick={() => setLightboxImage(null)}>
          <button className="absolute top-4 right-4 text-white hover:text-gray-300">
            <X size={32} />
          </button>
          <img src={lightboxImage} alt="Full screen" className="max-h-full max-w-full object-contain rounded-md" />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex justify-between items-center mb-8">
            <Link to="/directory" className="inline-flex items-center text-gray-500 hover:text-blue-600 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2"/> Back to Directory
            </Link>

            {/* Edit Button for Unlocked Profiles */}
            {!student.isLocked && (
                <Link to={`/edit-profile/${student.slug}`}>
                    <Button variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                        <Edit className="w-4 h-4 mr-2" /> Edit Profile (Unsecured)
                    </Button>
                </Link>
            )}
        </div>

        <div className="md:flex gap-12">
          {/* Left Column: Avatar & Basic Info */}
          <div className="md:w-1/3 flex flex-col items-center md:items-start">
            <div className="relative group">
                <div className="w-48 h-48 md:w-64 md:h-64 rounded-xl overflow-hidden shadow-2xl border-4 border-gray-100 bg-gray-100">
                    <img 
                        src={student.avatarUrl} 
                        alt={student.fullName}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className={`absolute bottom-4 right-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${
                    student.status === 'active' ? 'bg-green-500 text-white' : 
                    student.status === 'graduated' ? 'bg-blue-600 text-white' : 'bg-red-500 text-white'
                }`}>
                    {student.status}
                </div>
            </div>

            <h1 className="mt-6 text-3xl font-bold text-gray-900 text-center md:text-left">{student.fullName}</h1>
            <p className="text-xl text-blue-600 font-medium mt-1">{student.department}</p>
            <p className="text-gray-500 mt-1">{student.intake}</p>

            <div className="mt-6 flex items-center space-x-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg w-full justify-center md:justify-start">
                 <Eye className="w-4 h-4 text-blue-400" />
                 <span>{student.views.toLocaleString()} Total Views</span>
            </div>
            
            {/* Public Contact */}
            {student.contactEmail && (
                <div className="mt-4 w-full flex justify-center md:justify-start">
                   <a href={`mailto:${student.contactEmail}`} className="flex items-center text-gray-600 hover:text-blue-600 transition-colors bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 w-full justify-center md:w-auto">
                       <Mail className="w-4 h-4 mr-2" /> {student.contactEmail}
                   </a>
                </div>
            )}
            
            <div className="mt-6 w-full">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Social Connect</h3>
                <div className="flex space-x-3 justify-center md:justify-start flex-wrap gap-y-2">
                  {student.socialLinks.map((link, idx) => {
                    let Icon = Globe;
                    if (link.platform === 'github') Icon = Github;
                    else if (link.platform === 'linkedin') Icon = Linkedin;
                    else if (link.platform === 'twitter') Icon = Twitter;
                    else if (link.platform === 'facebook') Icon = Facebook;
                    else if (link.platform === 'instagram') Icon = Instagram;

                    return (
                      <a key={idx} href={link.url} target="_blank" rel="noreferrer" className="bg-gray-100 p-2.5 rounded-full text-gray-600 hover:bg-blue-600 hover:text-white transition-all">
                        <Icon className="w-5 h-5" />
                      </a>
                    );
                  })}
                  {student.socialLinks.length === 0 && <span className="text-sm text-gray-400 italic">No links available</span>}
                </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100 w-full">
                 <div className="flex items-center text-sm text-gray-400 mb-2">
                    <Calendar className="w-4 h-4 mr-2" />
                    Member since {new Date(student.createdAt).getFullYear()}
                 </div>
                 {!student.isLocked && (
                    <div className="flex items-center text-sm text-green-600 mt-2 bg-green-50 p-2 rounded">
                        <Unlock className="w-4 h-4 mr-2"/>
                        <span>This profile is Unlocked. You can edit it.</span>
                    </div>
                 )}
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="md:w-2/3 mt-10 md:mt-0">
            
            {/* Biography */}
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">Biography</h2>
              <div className="bg-gray-50 rounded-2xl p-6 md:p-8 text-gray-700 leading-relaxed text-lg border border-gray-100">
                {student.bio}
              </div>
            </section>

             {/* CGPA Section */}
            {student.cgpa && student.cgpa.length > 0 && (
                <section className="mb-10">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                        <GraduationCap className="w-6 h-6 mr-2 text-blue-600"/> Academic Performance
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {student.cgpa.map((sem) => (
                            <div key={sem.semester} className="bg-white border border-gray-200 rounded-lg p-4 text-center shadow-sm">
                                <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Semester {sem.semester}</div>
                                <div className="text-2xl font-bold text-blue-700">{sem.gpa}</div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Gallery */}
            {student.galleryImages.length > 0 && (
                <section className="mb-10">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Gallery</h2>
                    <div className="flex overflow-x-auto pb-4 gap-4 snap-x hide-scrollbar">
                        {student.galleryImages.map((img, idx) => (
                            <div 
                                key={idx} 
                                className="relative flex-none w-64 h-48 rounded-lg overflow-hidden cursor-pointer group snap-center border border-gray-200"
                                onClick={() => setLightboxImage(img)}
                            >
                                <img 
                                    src={img} 
                                    alt="Gallery" 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 drop-shadow-lg" />
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Courses & Certifications */}
            {student.courses && student.courses.length > 0 && (
                <section className="mb-10">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                        <BookOpen className="w-6 h-6 mr-2 text-blue-600"/> Courses & Certifications
                    </h2>
                    <div className="space-y-4">
                        {student.courses.map((course, idx) => (
                            <div key={idx} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between">
                                <div className="mb-4 sm:mb-0">
                                    <h4 className="font-bold text-gray-900 text-lg">{course.title}</h4>
                                    <p className="text-blue-600 font-medium text-sm">{course.provider}</p>
                                    <div className="flex items-center text-xs text-gray-500 mt-2">
                                        <Calendar className="w-3 h-3 mr-1"/>
                                        {course.startDate && <span>{new Date(course.startDate).toLocaleDateString()}</span>}
                                        {course.endDate && <span> - {new Date(course.endDate).toLocaleDateString()}</span>}
                                    </div>
                                </div>
                                {course.certificateUrl && (
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => handleCertDownload(course.certificateUrl!, course.title)}
                                    >
                                        <Download className="w-4 h-4 mr-2"/> Certificate
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Achievements */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Award className="w-6 h-6 mr-2 text-yellow-500"/> Achievements
              </h2>
              {student.achievements.length > 0 ? (
                <div className="grid gap-4">
                  {student.achievements.map((ach) => (
                    <div key={ach.id} className="flex items-start bg-white border border-gray-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="bg-yellow-100 p-2 rounded-full mr-4">
                        <Award className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">{ach.title}</h4>
                        <p className="text-sm text-gray-500 mb-1">{new Date(ach.date).toLocaleDateString()}</p>
                        <p className="text-gray-600">{ach.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No achievements listed yet.</p>
              )}
            </section>

          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
