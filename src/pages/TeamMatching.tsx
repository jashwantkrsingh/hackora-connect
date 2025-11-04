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
  gender: string | null;
  looking_for: string | null;
  skills: string[] | null;
  bio: string | null;
  year_of_study: string | null;
  projects: any;
}

const TeamMatching = () => {
  const { user } = useAuth();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedCollege, setSelectedCollege] = useState("Any College");
  const [selectedGender, setSelectedGender] = useState("Any Gender");
  const [selectedLookingFor, setSelectedLookingFor] = useState("Any");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);
  const [colleges, setColleges] = useState<string[]>(["Any College"]);
  const [loading, setLoading] = useState(true);

  const skills = ["React", "Python", "AI/ML", "Design", "Mobile", "Backend", "DevOps", "Blockchain"];

  useEffect(() => {
    if (user) {
      fetchCurrentUserProfile();
      fetchProfiles();
    }
  }, [user]);

  const fetchCurrentUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id || '')
        .single();

      if (error) throw error;
      setCurrentUserProfile(data);
    } catch (error) {
      console.error('Error fetching current user profile:', error);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user?.id || ''); // Exclude current user

      if (error) throw error;
      
      // Extract unique colleges
      const uniqueColleges = [...new Set(
        data
          ?.map(p => p.college)
          .filter(c => c && c.trim() !== '') as string[]
      )].sort();
      
      setColleges(["Any College", ...uniqueColleges]);
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
    const matchesGender = selectedGender === "Any Gender" || profile.gender === selectedGender.toLowerCase();
    const matchesLookingFor = selectedLookingFor === "Any" || profile.looking_for === selectedLookingFor;
    
    return matchesSkills && matchesCollege && matchesGender && matchesLookingFor && profile.full_name;
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

  const getLookingForLabel = (lookingFor: string | null) => {
    if (!lookingFor) return "";
    switch (lookingFor) {
      case "team_members": return "🔍 Looking for Team Members";
      case "teams": return "👥 Looking to Join Teams";
      case "both": return "🤝 Open to Both";
      default: return "";
    }
  };

  const isProfileComplete = currentUserProfile && 
    currentUserProfile.full_name && 
    currentUserProfile.college && 
    currentUserProfile.year_of_study &&
    currentUserProfile.gender &&
    currentUserProfile.looking_for;

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
          {profile.looking_for && (
            <div className="text-sm text-blue-400 mt-1">
              {getLookingForLabel(profile.looking_for)}
            </div>
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

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Gender</h3>
                <select 
                  className="input-hackora w-full"
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                >
                  <option>Any Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Looking For</h3>
                <select 
                  className="input-hackora w-full"
                  value={selectedLookingFor}
                  onChange={(e) => setSelectedLookingFor(e.target.value)}
                >
                  <option value="Any">Any</option>
                  <option value="team_members">Team Members</option>
                  <option value="teams">Teams to Join</option>
                  <option value="both">Both</option>
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
            {!isProfileComplete && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mb-8"
              >
                <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-2xl p-6">
                  <h2 className="text-2xl font-bold mb-2">⚠️ Complete Your Profile</h2>
                  <p className="text-gray-400 mb-4">
                    To find the perfect teammates, please complete your profile first. Add your college, year, gender, and what you're looking for!
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.href = '/profile'}
                    className="btn-primary"
                  >
                    Complete Profile
                  </motion.button>
                </div>
              </motion.div>
            )}

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