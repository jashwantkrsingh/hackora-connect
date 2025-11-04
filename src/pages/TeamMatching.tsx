import { motion } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { MapPin, Star, MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  college: string | null;
  skills: string[] | null;
  bio: string | null;
  year_of_study: string | null;
  projects: any;
}

const TeamMatching = () => {
  const { user } = useAuth();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedCollege, setSelectedCollege] = useState("Any College");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const skills = ["React", "Python", "AI/ML", "Design", "Mobile", "Backend", "DevOps", "Blockchain"];
  const colleges = ["Any College", "Stanford University", "MIT", "University of Washington", "Columbia University", "UT Austin", "University of Chicago", "Oregon State University"];

  useEffect(() => {
    fetchProfiles();
  }, [user]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id || ''); // Exclude current user

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast.error('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = profiles.filter(profile => {
    const profileSkills = profile.skills || [];
    const matchesSkills = selectedSkills.length === 0 || 
      selectedSkills.some(skill => 
        profileSkills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
      );
    const matchesCollege = selectedCollege === "Any College" || profile.college === selectedCollege;
    return matchesSkills && matchesCollege && profile.full_name;
  });

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const TeammateCard = ({ profile, index }: { profile: Profile, index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className="card-hover"
    >
      <div className="flex items-start space-x-4 mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-bold text-white">
          {getInitials(profile.full_name)}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold">{profile.full_name || 'Anonymous'}</h3>
          <p className="text-gray-400">{profile.year_of_study || 'Student'}</p>
          {profile.college && (
            <div className="text-sm text-gray-500 mt-1">{profile.college}</div>
          )}
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-1 text-yellow-400 mb-1">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-white">New</span>
          </div>
          <div className="text-sm text-gray-400">
            {Array.isArray(profile.projects) ? profile.projects.length : 0} projects
          </div>
        </div>
      </div>

      {profile.bio && (
        <p className="text-gray-400 mb-4 text-sm">{profile.bio}</p>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {(profile.skills || []).map((skill, skillIndex) => (
          <span
            key={skillIndex}
            className="bg-gray-700 text-gray-300 px-3 py-1 rounded-lg text-sm"
          >
            {skill}
          </span>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="btn-primary w-full flex items-center justify-center space-x-2"
      >
        <MessageCircle className="w-4 h-4" />
        <span>Request Collaboration</span>
      </motion.button>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-80 mr-8 sticky top-24"
          >
            <div className="card-primary">
              <h2 className="text-2xl font-bold mb-6">Find Teammates</h2>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1 rounded-lg text-sm transition-all duration-200 ${
                        selectedSkills.includes(skill)
                          ? "bg-white text-black"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">College</h3>
                <select 
                  className="input-hackora w-full"
                  value={selectedCollege}
                  onChange={(e) => setSelectedCollege(e.target.value)}
                >
                  {colleges.map((college) => (
                    <option key={college} value={college}>{college}</option>
                  ))}
                </select>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Experience Level</h3>
                <select className="input-hackora w-full">
                  <option>Any Level</option>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8"
            >
              <h1 className="text-4xl font-bold mb-2">Team Matching 🤝</h1>
              <p className="text-gray-400">Connect with talented individuals for your next project</p>
            </motion.div>

            {/* AI Suggested Section */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                <p className="text-gray-400 mt-4">Loading profiles...</p>
              </div>
            ) : filteredProfiles.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No profiles found. Be the first to create your profile!</p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <h2 className="text-2xl font-bold mb-6">Available Teammates</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {filteredProfiles.map((profile, index) => (
                    <TeammateCard key={profile.id} profile={profile} index={index} />
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamMatching;