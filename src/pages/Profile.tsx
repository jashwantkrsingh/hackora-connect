import { motion } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { User, Github, Save, Plus, X, ExternalLink, Star, Award, Linkedin, Globe, Calendar, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [profile, setProfile] = useState({
    name: "",
    college: "",
    location: "",
    skills: [],
    interests: [],
    bio: "",
    socialLinks: [],
    projects: []
  });

  const [newSkill, setNewSkill] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    technologies: "",
    link: "",
    date: ""
  });
  const [newSocialLink, setNewSocialLink] = useState({
    platform: "",
    url: ""
  });
  const [profileRating, setProfileRating] = useState(0);

  const socialPlatforms = [
    { name: "GitHub", icon: Github, color: "text-gray-400" },
    { name: "LinkedIn", icon: Linkedin, color: "text-blue-400" },
    { name: "Kaggle", icon: Award, color: "text-cyan-400" },
    { name: "Portfolio", icon: Globe, color: "text-green-400" },
    { name: "Twitter", icon: ExternalLink, color: "text-blue-300" }
  ];

  const badges = [
    { name: "First Project", color: "bg-blue-500", earned: profile.projects.length > 0 },
    { name: "Team Player", color: "bg-green-500", earned: profile.socialLinks.length >= 2 },
    { name: "Skill Master", color: "bg-purple-500", earned: profile.skills.length >= 5 },
    { name: "Complete Profile", color: "bg-yellow-500", earned: profileRating >= 80 }
  ];

  useEffect(() => {
    calculateProfileRating();
  }, [profile]);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const socialLinks = [];
        if (data.github_url) socialLinks.push({ platform: "GitHub", url: data.github_url });
        if (data.linkedin_url) socialLinks.push({ platform: "LinkedIn", url: data.linkedin_url });
        if (data.kaggle_url) socialLinks.push({ platform: "Kaggle", url: data.kaggle_url });
        if (data.portfolio_url) socialLinks.push({ platform: "Portfolio", url: data.portfolio_url });
        if (data.twitter_url) socialLinks.push({ platform: "Twitter", url: data.twitter_url });

        setProfile({
          name: data.full_name || "",
          college: data.college || "",
          location: "",
          skills: Array.isArray(data.skills) ? data.skills : [],
          interests: Array.isArray(data.interests) ? data.interests : [],
          bio: data.bio || "",
          socialLinks: socialLinks,
          projects: Array.isArray(data.projects) ? data.projects : []
        });
      }
    } catch (error: any) {
      toast.error('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const socialLinksMap = {
        GitHub: profile.socialLinks.find(l => l.platform === "GitHub")?.url || null,
        LinkedIn: profile.socialLinks.find(l => l.platform === "LinkedIn")?.url || null,
        Kaggle: profile.socialLinks.find(l => l.platform === "Kaggle")?.url || null,
        Portfolio: profile.socialLinks.find(l => l.platform === "Portfolio")?.url || null,
        Twitter: profile.socialLinks.find(l => l.platform === "Twitter")?.url || null,
      };

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          full_name: profile.name,
          college: profile.college,
          bio: profile.bio,
          skills: profile.skills,
          interests: profile.interests,
          github_url: socialLinksMap.GitHub,
          linkedin_url: socialLinksMap.LinkedIn,
          kaggle_url: socialLinksMap.Kaggle,
          portfolio_url: socialLinksMap.Portfolio,
          twitter_url: socialLinksMap.Twitter,
          projects: profile.projects,
          email: user?.email,
        });

      if (error) throw error;

      toast.success('Profile saved successfully!');
    } catch (error: any) {
      toast.error('Error saving profile');
    } finally {
      setSaving(false);
    }
  };

  const calculateProfileRating = () => {
    let score = 0;
    const maxScore = 100;
    
    // Basic info (30 points)
    if (profile.name.trim()) score += 10;
    if (profile.college.trim()) score += 10;
    if (profile.bio.trim() && profile.bio.length >= 50) score += 10;
    
    // Skills and interests (25 points)
    if (profile.skills.length >= 3) score += 10;
    if (profile.skills.length >= 5) score += 5;
    if (profile.interests.length >= 2) score += 10;
    
    // Social links (20 points)
    if (profile.socialLinks.length >= 1) score += 10;
    if (profile.socialLinks.length >= 3) score += 10;
    
    // Projects (25 points)
    if (profile.projects.length >= 1) score += 15;
    if (profile.projects.length >= 3) score += 10;
    
    setProfileRating(Math.min(score, maxScore));
  };

  const addSkill = (e) => {
    if (e.key === 'Enter' && newSkill.trim()) {
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (index) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const addInterest = (e) => {
    if (e.key === 'Enter' && newInterest.trim()) {
      setProfile(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }));
      setNewInterest("");
    }
  };

  const removeInterest = (index) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.filter((_, i) => i !== index)
    }));
  };

  const addSocialLink = () => {
    if (newSocialLink.platform && newSocialLink.url.trim()) {
      setProfile(prev => ({
        ...prev,
        socialLinks: [...prev.socialLinks, { ...newSocialLink }]
      }));
      setNewSocialLink({ platform: "", url: "" });
    }
  };

  const removeSocialLink = (index) => {
    setProfile(prev => ({
      ...prev,
      socialLinks: prev.socialLinks.filter((_, i) => i !== index)
    }));
  };

  const addProject = () => {
    if (newProject.title.trim() && newProject.description.trim()) {
      setProfile(prev => ({
        ...prev,
        projects: [...prev.projects, { ...newProject, id: Date.now() }]
      }));
      setNewProject({
        title: "",
        description: "",
        technologies: "",
        link: "",
        date: ""
      });
    }
  };

  const removeProject = (id) => {
    setProfile(prev => ({
      ...prev,
      projects: prev.projects.filter(project => project.id !== id)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navigation />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="card-primary"
        >
          {/* Profile Header with Rating */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
                <p className="text-gray-400">Manage your Hackora profile and preferences</p>
              </div>
            </div>
            
            {/* Profile Rating */}
            <Card className="bg-gray-800 border-gray-700 min-w-[200px]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Profile Score</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-lg font-bold">{profileRating}%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <motion.div 
                    className="bg-gradient-to-r from-yellow-400 to-green-400 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${profileRating}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {profileRating < 30 ? "Getting started" : 
                   profileRating < 60 ? "Good progress" : 
                   profileRating < 80 ? "Almost there" : "Excellent!"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Profile Form */}
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-white font-medium mb-2">Name</label>
                <Input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">College/University</label>
                <Input
                  type="text"
                  value={profile.college}
                  onChange={(e) => setProfile({...profile, college: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Your institution"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Location</label>
                <Input
                  type="text"
                  value={profile.location}
                  onChange={(e) => setProfile({...profile, location: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="City, State"
                />
              </div>
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Bio</label>
              <Textarea
                value={profile.bio}
                onChange={(e) => setProfile({...profile, bio: e.target.value})}
                className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                placeholder="Tell us about yourself... (minimum 50 characters for better rating)"
              />
              <p className="text-xs text-gray-400 mt-1">{profile.bio.length}/200 characters</p>
            </div>

            {/* Skills Section */}
            <div>
              <label className="block text-white font-medium mb-2">Skills</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {profile.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600">
                    {skill}
                    <button 
                      onClick={() => removeSkill(index)}
                      className="ml-2 hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={addSkill}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Add a skill and press Enter"
              />
            </div>

            {/* Interests Section */}
            <div>
              <label className="block text-white font-medium mb-2">Interests</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {profile.interests.map((interest, index) => (
                  <Badge key={index} variant="outline" className="text-white border-gray-600 hover:bg-gray-700">
                    {interest}
                    <button 
                      onClick={() => removeInterest(index)}
                      className="ml-2 hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                type="text"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyPress={addInterest}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Add an interest and press Enter"
              />
            </div>

            {/* Social Links Section */}
            <div>
              <label className="block text-white font-medium mb-4">Social Links</label>
              
              {/* Existing Links */}
              <div className="space-y-3 mb-4">
                {profile.socialLinks.map((link, index) => {
                  const platform = socialPlatforms.find(p => p.name === link.platform);
                  const IconComponent = platform?.icon || ExternalLink;
                  return (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
                      <IconComponent className={`w-5 h-5 ${platform?.color || 'text-gray-400'}`} />
                      <span className="text-sm font-medium text-gray-300">{link.platform}</span>
                      <span className="text-sm text-gray-400 flex-1 truncate">{link.url}</span>
                      <button 
                        onClick={() => removeSocialLink(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Add New Link */}
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex space-x-3">
                    <select
                      value={newSocialLink.platform}
                      onChange={(e) => setNewSocialLink({...newSocialLink, platform: e.target.value})}
                      className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white text-sm"
                    >
                      <option value="">Select Platform</option>
                      {socialPlatforms.map(platform => (
                        <option key={platform.name} value={platform.name}>{platform.name}</option>
                      ))}
                    </select>
                    <Input
                      type="url"
                      value={newSocialLink.url}
                      onChange={(e) => setNewSocialLink({...newSocialLink, url: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white flex-1"
                      placeholder="https://..."
                    />
                    <Button 
                      onClick={addSocialLink}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Projects Section */}
            <div>
              <label className="block text-white font-medium mb-4">Projects</label>
              
              {/* Existing Projects */}
              <div className="space-y-4 mb-4">
                {profile.projects.map((project) => (
                  <Card key={project.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-white">{project.title}</h3>
                        <button 
                          onClick={() => removeProject(project.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-gray-300 text-sm mb-2">{project.description}</p>
                      {project.technologies && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {project.technologies.split(',').map((tech, i) => (
                            <Badge key={i} variant="outline" className="text-xs border-gray-600 text-gray-300">
                              {tech.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        {project.date && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{project.date}</span>
                          </div>
                        )}
                        {project.link && (
                          <a 
                            href={project.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-blue-400 hover:text-blue-300"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>View Project</span>
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Add New Project */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg">Add New Project</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Input
                        type="text"
                        value={newProject.title}
                        onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="Project Title"
                      />
                    </div>
                    <div>
                      <Input
                        type="date"
                        value={newProject.date}
                        onChange={(e) => setNewProject({...newProject, date: e.target.value})}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  <Textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Project Description"
                    rows={3}
                  />
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      type="text"
                      value={newProject.technologies}
                      onChange={(e) => setNewProject({...newProject, technologies: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Technologies (comma separated)"
                    />
                    <Input
                      type="url"
                      value={newProject.link}
                      onChange={(e) => setNewProject({...newProject, link: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Project Link (optional)"
                    />
                  </div>
                  <Button 
                    onClick={addProject}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Project
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Badges Section */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Achievement Badges</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {badges.map((badge, index) => (
                <motion.div
                  key={badge.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`bg-gray-800 border rounded-xl p-4 text-center transition-all ${
                    badge.earned ? 'border-gray-600 opacity-100' : 'border-gray-700 opacity-50'
                  }`}
                >
                  <div className={`w-8 h-8 ${badge.color} rounded-full mx-auto mb-2 ${
                    badge.earned ? '' : 'grayscale'
                  }`}></div>
                  <div className="text-sm font-medium">{badge.name}</div>
                  {badge.earned && (
                    <div className="text-xs text-green-400 mt-1">✓ Earned</div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="btn-primary mt-8 w-full md:w-auto"
            size="lg"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;