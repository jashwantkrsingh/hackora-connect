import { motion } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { Send, Hash, Users, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

interface Channel {
  id: string;
  name: string;
  description: string | null;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string | null;
  };
}

const CommunityHub = () => {
  const { user } = useAuth();
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    if (selectedChannelId) {
      fetchMessages();
      subscribeToMessages();
    }
  }, [selectedChannelId]);

  const fetchChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .order('name');

      if (error) throw error;
      setChannels(data || []);
      if (data && data.length > 0) {
        setSelectedChannelId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
      toast.error('Failed to load channels');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', selectedChannelId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch all unique user profiles
      const userIds = [...new Set(data?.map(m => m.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      const messagesWithProfiles = (data || []).map(msg => ({
        ...msg,
        profiles: profilesMap.get(msg.user_id) || { full_name: null }
      }));

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${selectedChannelId}`
        },
        async (payload) => {
          // Fetch the profile data for the new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', payload.new.user_id)
            .single();

          setMessages(prev => [...prev, {
            ...payload.new as Message,
            profiles: profile
          }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !user) {
      toast.error('Please sign in to send messages');
      return;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          channel_id: selectedChannelId,
          user_id: user.id,
          content: message.trim()
        });

      if (error) throw error;
      setMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "??";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const selectedChannel = channels.find(c => c.id === selectedChannelId);

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex h-[calc(100vh-12rem)]">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-80 bg-gray-900 border border-gray-800 rounded-2xl mr-6 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-2xl font-bold mb-4">Hackora Community</h2>
              <div className="flex items-center space-x-2 text-gray-400">
                <Users className="w-4 h-4" />
                <span>1,247 members online</span>
              </div>
            </div>

            <div className="p-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-300">Channels</h3>
              <div className="space-y-1">
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => setSelectedChannelId(channel.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                      selectedChannelId === channel.id
                        ? "bg-gray-700 text-white"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Hash className="w-4 h-4" />
                      <span>{channel.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-800 mt-auto">
              <h3 className="text-lg font-semibold mb-3 text-gray-300">Trending</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-gray-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">#hackathon2024</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">#react-tips</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm">#job-opportunities</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Chat Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl flex flex-col overflow-hidden"
          >
            {/* Chat Header */}
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center space-x-2">
                <Hash className="w-6 h-6 text-gray-400" />
                <h1 className="text-2xl font-bold">{selectedChannel?.name || 'Select a channel'}</h1>
                {selectedChannel?.description && (
                  <span className="text-gray-400">• {selectedChannel.description}</span>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                  <p className="text-gray-400 mt-4">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">No messages yet. Be the first to say hello!</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isOwn = msg.user_id === user?.id;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-3 max-w-2xl ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0">
                          {getInitials(msg.profiles?.full_name || null)}
                        </div>
                        <div className={`p-4 rounded-2xl ${
                          isOwn 
                            ? 'bg-white text-black rounded-br-md' 
                            : 'bg-gray-700 text-white rounded-bl-md'
                        }`}>
                          {!isOwn && (
                            <div className="font-semibold text-sm mb-1">
                              {msg.profiles?.full_name || 'Anonymous'}
                            </div>
                          )}
                          <div className="leading-relaxed">{msg.content}</div>
                          <div className={`text-xs mt-2 ${isOwn ? 'text-gray-600' : 'text-gray-400'}`}>
                            {format(new Date(msg.created_at), 'p')}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Message Input */}
            <div className="p-6 border-t border-gray-800">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="input-hackora flex-1"
                  placeholder={`Message #${selectedChannel?.name || 'channel'}`}
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  className="btn-primary p-3"
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CommunityHub;