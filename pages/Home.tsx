
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Users, Award, Calendar } from 'lucide-react';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { api } from '../services/mockDb';
import { Notice, Student, AdminUser, CampusImage } from '../types';

const Home: React.FC = () => {
  const [featuredStudents, setFeaturedStudents] = useState<Student[]>([]);
  const [latestNotices, setLatestNotices] = useState<Notice[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [campusImages, setCampusImages] = useState<CampusImage[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [students, notices, adminList, images] = await Promise.all([
        api.getStudents(),
        api.getNotices(),
        api.getAdminUsers(),
        api.getCampusImages()
      ]);
      setFeaturedStudents(students.filter(s => s.isFeatured).slice(0, 3));
      setLatestNotices(notices.slice(0, 3));
      setAdmins(adminList.slice(0, 4));
      setCampusImages(images);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Slideshow Logic
  useEffect(() => {
    if (campusImages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % campusImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [campusImages]);

  const getRankName = (score: number) => {
    if (score > 1000) return 'Legend';
    if (score > 500) return 'Guardian';
    if (score > 100) return 'Contributor';
    return 'Observer';
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block xl:inline">BIMT Student Association</span>{' '}
                  <span className="block text-blue-900 xl:inline">Unity & Excellence</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  The central hub for BIMT students to share academic resources, showcase achievements, and stay updated with campus life.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link to="/directory">
                      <Button size="lg" className="bg-blue-900 hover:bg-blue-800">Explore Directory</Button>
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link to="/resources">
                      <Button variant="secondary" size="lg">View Resources</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 bg-gray-50 h-56 sm:h-72 md:h-96 lg:h-full relative overflow-hidden">
             {campusImages.length > 0 ? (
                 campusImages.map((img, idx) => (
                     <img
                       key={img.id}
                       src={img.url}
                       alt="Campus Slide"
                       className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                     />
                 ))
             ) : (
                 <img
                    className="w-full h-full object-cover"
                    src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
                    alt="Students on campus"
                 />
             )}
             
             {campusImages.length > 1 && (
                 <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                     {campusImages.map((_, idx) => (
                         <div 
                           key={idx} 
                           className={`h-2 w-2 rounded-full transition-colors ${idx === currentSlide ? 'bg-white' : 'bg-white/50'}`}
                         />
                     ))}
                 </div>
             )}
        </div>
      </section>

      {/* Latest Notices */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Latest Notices</h2>
          <Link to="/notices" className="text-blue-900 font-medium hover:text-blue-800 flex items-center">
            View All <ArrowRight className="ml-1 w-4 h-4" />
          </Link>
        </div>
        
        {loading ? (
          <div className="text-center py-10">Loading notices...</div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {latestNotices.map((notice) => (
              <div key={notice.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant={notice.type === 'exam' ? 'danger' : notice.type === 'campus' ? 'info' : 'success'}>
                    {notice.type.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-gray-500 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(notice.postedAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{notice.title}</h3>
                <p className="text-gray-600 line-clamp-3 mb-4 text-sm">{notice.content}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Meet the Team (Admins & Mods Rank Display) */}
      <section className="bg-gray-900 py-16 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-12">
             <h2 className="text-3xl font-bold">Our Team</h2>
             <p className="text-gray-400 mt-2">The dedicated leadership managing the platform and ensuring community quality.</p>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {admins.map((admin) => (
                <Link 
                  key={admin.id} 
                  to={admin.linkedStudentSlug ? `/directory/${admin.linkedStudentSlug}` : '#'}
                  className={`block bg-gray-800 rounded-lg p-6 text-center border border-gray-700 transition-transform ${admin.linkedStudentSlug ? 'hover:scale-105 hover:border-blue-500 cursor-pointer' : 'cursor-default'}`}
                >
                    <img src={admin.avatarUrl} alt={admin.fullName} className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-blue-500 object-cover" />
                    <h3 className="text-lg font-bold">{admin.fullName}</h3>
                    <p className="text-blue-400 text-sm">{admin.title}</p>
                    <div className="mt-4 inline-block px-3 py-1 bg-gray-700 rounded-full text-xs font-mono tracking-wider">
                       Rank: {getRankName(admin.activityScore)}
                    </div>
                 </Link>
              ))}
           </div>
        </div>
      </section>

      {/* Featured Students */}
      <section className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Featured Students</h2>
            <Link to="/directory" className="text-blue-900 font-medium hover:text-blue-800 flex items-center">
              Browse Directory <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>

          {loading ? (
             <div className="text-center py-10">Loading students...</div>
          ) : (
            <div className="grid gap-8 md:grid-cols-3">
              {featuredStudents.map((student) => (
                <div key={student.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300">
                  <div className="h-32 bg-gradient-to-r from-blue-800 to-blue-600"></div>
                  <div className="px-6 pb-6">
                    <div className="relative flex justify-center">
                      <img 
                        src={student.avatarUrl} 
                        alt={student.fullName}
                        className="h-24 w-24 rounded-full border-4 border-white -mt-12 bg-white object-cover"
                      />
                    </div>
                    <div className="text-center mt-4">
                      <h3 className="text-xl font-bold text-gray-900">{student.fullName}</h3>
                      <p className="text-sm text-blue-600 font-medium">{student.department}</p>
                      <p className="text-xs text-gray-500 mt-1">{student.intake}</p>
                      <p className="mt-3 text-gray-600 text-sm line-clamp-2">{student.bio}</p>
                    </div>
                    <div className="mt-6 border-t pt-4 flex justify-between items-center text-sm text-gray-500">
                       <span className="flex items-center"><Award className="w-4 h-4 mr-1 text-yellow-500"/> {student.achievements.length} Awards</span>
                       <Link to={`/directory/${student.slug}`}>
                        <Button variant="outline" size="sm">View Profile</Button>
                       </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
