
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Eye } from 'lucide-react';
import { api } from '../services/mockDb';
import { Student, Department } from '../types';
import Badge from '../components/Badge';

const Directory: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    dept: 'All',
    intake: ''
  });

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      const data = await api.getStudents({
        search: filters.search,
        dept: filters.dept === 'All' ? undefined : filters.dept,
        intake: filters.intake === '' ? undefined : filters.intake
      });

      // Sorting Logic: Alphabetical First, then Rank (Score)
      const rankedData = data.map(s => {
          let totalGpa = 0;
          let count = 0;
          if (s.cgpa) {
              s.cgpa.forEach(i => { const val = parseFloat(i.gpa); if(!isNaN(val)) { totalGpa+=val; count++ } });
          }
          const avgGpa = count > 0 ? totalGpa/count : 0;
          const score = (avgGpa * 25) + (s.achievements.length * 10) + (s.views * 0.05);
          return { ...s, rankScore: score };
      });

      rankedData.sort((a, b) => {
          const nameA = a.fullName.toUpperCase();
          const nameB = b.fullName.toUpperCase();
          if (nameA < nameB) return -1;
          if (nameA > nameB) return 1;
          
          // Names are equal (unlikely), fallback to rank
          return b.rankScore - a.rankScore; 
      });

      setStudents(rankedData);
      setLoading(false);
    };
    
    // Debounce search slightly
    const timer = setTimeout(fetchStudents, 300);
    return () => clearTimeout(timer);
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Student Directory</h1>
        <p className="mt-2 text-gray-600">Find classmates, alumni, and peers across departments.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name or bio..."
                className="pl-10 block w-full rounded-md border-gray-600 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2 bg-gray-800 text-white"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              className="block w-full rounded-md border-gray-600 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2 bg-gray-800 text-white"
              value={filters.dept}
              onChange={(e) => handleFilterChange('dept', e.target.value)}
            >
              <option value="All">All Departments</option>
              {Object.values(Department).map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Intake / Batch</label>
            <input
               type="text"
               placeholder="e.g. Batch 25"
               className="block w-full rounded-md border-gray-600 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border p-2 bg-gray-800 text-white"
               value={filters.intake}
               onChange={(e) => handleFilterChange('intake', e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading directory...</p>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
          <Filter className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No students found</h3>
          <p className="text-gray-500">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student) => (
            <Link key={student.id} to={`/directory/${student.slug}`} className="block group">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all duration-200 h-full flex flex-col">
                <div className="flex items-start justify-between">
                  <div className="flex-center">
                     <div className="flex items-center">
                        <img 
                          src={student.avatarUrl} 
                          alt={student.fullName}
                          className="h-12 w-12 rounded-full object-cover border border-gray-100"
                        />
                        <div className="ml-3">
                          <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {student.fullName}
                          </h3>
                          <p className="text-xs text-gray-500">{student.department}</p>
                        </div>
                     </div>
                  </div>
                  <div className="flex flex-col items-end">
                      {student.isFeatured && (
                        <Badge variant="warning" className="mb-1">Featured</Badge>
                      )}
                  </div>
                </div>
                
                <div className="mt-4 flex-grow">
                  <p className="text-sm text-gray-600 line-clamp-2">{student.bio}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>{student.intake}</span>
                  <span className="flex items-center">
                    <Eye className="w-3 h-3 mr-1" /> {student.views}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Directory;
