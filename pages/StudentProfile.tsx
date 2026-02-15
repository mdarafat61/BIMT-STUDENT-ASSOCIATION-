import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, Award, Globe, Github, Linkedin, Twitter, 
  Eye, X, ZoomIn, Mail, Facebook, Instagram, Edit, Unlock, 
  GraduationCap, BookOpen, Download, FileText, Maximize2 
} from 'lucide-react';
import { api } from '../services/mockDb';
import { Student } from '../types';
import Button from '../components/Button';

const StudentProfile: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [viewingPdf, setViewingPdf] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    const fetchStudent = async () => {
      if (slug) {
        api.incrementStudentViews(slug).catch(e => console.error(e));
        const data = await api.getStudentBySlug(slug);
        setStudent(data || null);
      }
      setLoading(false);
    };
    fetchStudent();
  }, [slug]);

  const isImage = (url: string) => {
    if (url.startsWith('data:image/')) return true;
    return /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(url);
  };

  const isPdf = (url: string) => {
    if (url.startsWith('data:application/pdf')) return true;
    return /\.pdf$/i.test(url);
  };

  const handleDownload = (url: string, title: string, prefix: string = 'Document') => {
    if (url.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = url;
      const mimeMatch = url.split(';')[0].split(':')[1];
      let ext = 'pdf';
      if (mimeMatch.includes('image')) ext = mimeMatch.split('/')[1] || 'jpg';
      link.download = `${title.replace(/[^a-z0-9]/gi, '_')}_${prefix}.${ext}`;
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
      {/* Lightbox for Images */}
      {lightboxImage && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setLightboxImage(null)}>
          <button className="absolute top-6 right-6 text-white hover:bg-white/10 p-2 rounded-full transition-colors">
            <X size={32} />
          </button>
          <img 
            src={lightboxImage} 
            alt="Full screen" 
            className="max-h-full max-w-full object-contain rounded-lg shadow-2xl" 
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* PDF Viewer Modal */}
      {viewingPdf && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white w-full h-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 bg-gray-900 text-white flex justify-between items-center">
              <div className="flex items-center">
                <FileText className="w-5 h-5 mr-3 text-blue-400" />
                <h3 className="font-bold truncate max-w-xs sm:max-w-md">{viewingPdf.title}</h3>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleDownload(viewingPdf.url, viewingPdf.title, 'Achievement_Proof')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Download PDF"
                >
                  <Download size={20} />
                </button>
                <button 
                  onClick={() => setViewingPdf(null)}
                  className="p-2 hover:bg-red-500 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-gray-100 relative">
              <iframe 
                src={viewingPdf.url} 
                className="w-full h-full border-none"
                title="PDF Viewer"
              />
              <div className="absolute bottom-4 right-4 bg-gray-900/50 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest pointer-events-none">
                Use browser controls to Zoom
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex justify-between items-center mb-8">
            <Link to="/directory" className="inline-flex items-center text-gray-500 hover:text-blue-600 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2"/> Back to Directory
            </Link>

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
            
            <section className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">Biography</h2>
              <div className="bg-gray-50 rounded-2xl p-6 md:p-8 text-gray-700 leading-relaxed text-lg border border-gray-100">
                {student.bio}
              </div>
            </section>

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
                                        onClick={() => handleDownload(course.certificateUrl!, course.title, 'Certificate')}
                                    >
                                        <Download className="w-4 h-4 mr-2"/> Certificate
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Achievements Section with Improved Document Previews */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Award className="w-6 h-6 mr-2 text-yellow-500"/> Achievements
              </h2>
              {student.achievements.length > 0 ? (
                <div className="grid gap-6">
                  {student.achievements.map((ach) => (
                    <div key={ach.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col sm:flex-row">
                      <div className="p-6 flex-1 flex flex-col sm:flex-row items-start">
                        <div className="bg-yellow-50 p-3 rounded-2xl mr-5 hidden sm:block">
                          <Award className="w-8 h-8 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <Award className="w-4 h-4 text-yellow-600 mr-2 sm:hidden" />
                            <h4 className="font-bold text-gray-900 text-xl leading-tight">{ach.title}</h4>
                          </div>
                          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 bg-blue-50 inline-block px-2 py-0.5 rounded">
                            {new Date(ach.date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                          </p>
                          <p className="text-gray-600 text-sm leading-relaxed">{ach.description}</p>
                          
                          {/* Conditional PDF view button */}
                          {ach.attachmentUrl && isPdf(ach.attachmentUrl) && (
                            <div className="mt-4">
                              <button 
                                onClick={() => setViewingPdf({ url: ach.attachmentUrl!, title: ach.title })}
                                className="inline-flex items-center text-blue-600 font-bold text-xs hover:text-blue-800 transition-colors bg-blue-50 px-3 py-2 rounded-xl border border-blue-100"
                              >
                                <FileText className="w-4 h-4 mr-2" /> View PDF Verification
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Original Image Display if Attachment is an Image */}
                      {ach.attachmentUrl && isImage(ach.attachmentUrl) && (
                        <div className="sm:w-48 h-48 sm:h-auto relative group flex-shrink-0 cursor-pointer overflow-hidden border-t sm:border-t-0 sm:border-l border-gray-100" onClick={() => setLightboxImage(ach.attachmentUrl!)}>
                          <img 
                            src={ach.attachmentUrl} 
                            alt="Achievement verification" 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                            <div className="bg-white/20 backdrop-blur-md p-2 rounded-lg border border-white/30 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                              <Maximize2 className="text-white w-5 h-5" />
                            </div>
                          </div>
                          <div className="absolute top-2 right-2 bg-white/70 backdrop-blur-sm px-2 py-1 rounded text-[8px] font-black uppercase tracking-tighter text-gray-900 border border-white shadow-sm">
                            Proof
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic py-10 text-center border-2 border-dashed border-gray-100 rounded-2xl">No achievements listed yet.</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;