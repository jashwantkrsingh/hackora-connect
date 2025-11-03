import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, User, Lightbulb, Users, MessageCircle, Briefcase, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./ui/button";

const navItems = [
  { path: "/dashboard", icon: Home, label: "Dashboard" },
  { path: "/ideas", icon: Lightbulb, label: "Ideas Hub" },
  { path: "/teams", icon: Users, label: "Team Matching" },
  { path: "/community", icon: MessageCircle, label: "Community" },
  { path: "/profile", icon: User, label: "Profile" },
];

export const Navigation = () => {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <nav className="bg-black border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-white font-bold text-xl"
            >
              Hackora ✨
            </motion.div>
          </Link>

          <div className="flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-white text-black"
                      : "text-gray-400 hover:text-white hover:bg-gray-900"
                  }`}
                >
                  <Icon size={18} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
            
            <Button
              onClick={signOut}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white hover:bg-gray-900"
            >
              <LogOut size={18} className="mr-2" />
              <span className="font-medium">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};