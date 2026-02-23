/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  Sparkles, 
  Heart, 
  Trash2, 
  ChevronRight, 
  Baby, 
  Moon, 
  Star,
  Info,
  Copy,
  Check,
  Share2,
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NameResult {
  name: string;
  transliteration: string;
  meaning: string;
  origin: string;
  gender: 'Boy' | 'Girl' | 'Unisex';
  significance?: string;
}

export default function App() {
  const [gender, setGender] = useState<'Boy' | 'Girl' | 'Both'>('Both');
  const [startingLetter, setStartingLetter] = useState('');
  const [theme, setTheme] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<NameResult[]>([]);
  const [favorites, setFavorites] = useState<NameResult[]>([]);
  const [copiedName, setCopiedName] = useState<string | null>(null);
  const [batchSize, setBatchSize] = useState(20);

  // Load favorites from local storage
  useEffect(() => {
    const saved = localStorage.getItem('noor_favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse favorites", e);
      }
    }
  }, []);

  // Save favorites to local storage
  useEffect(() => {
    localStorage.setItem('noor_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const generateNames = async (append = false) => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const prompt = `Generate ${batchSize} beautiful and meaningful Muslim baby names.
      ${gender !== 'Both' ? `Gender: ${gender}` : ''}
      ${startingLetter ? `Starting with the letter: ${startingLetter}` : ''}
      ${theme ? `Theme/Meaning preference: ${theme}` : ''}
      
      Provide the names in a structured format including the Arabic/Original script, transliteration, meaning, origin (e.g., Arabic, Persian, Turkish), and a brief note on its significance or historical context. 
      Ensure the names are unique and diverse.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "The name in original script (Arabic/Persian/etc)" },
                transliteration: { type: Type.STRING, description: "The English transliteration" },
                meaning: { type: Type.STRING, description: "The meaning of the name" },
                origin: { type: Type.STRING, description: "The linguistic origin" },
                gender: { type: Type.STRING, enum: ["Boy", "Girl", "Unisex"] },
                significance: { type: Type.STRING, description: "Brief historical or religious significance" }
              },
              required: ["name", "transliteration", "meaning", "origin", "gender"]
            }
          }
        }
      });

      const data = JSON.parse(response.text || "[]");
      if (append) {
        setResults(prev => [...prev, ...data]);
      } else {
        setResults(data);
      }
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (nameObj: NameResult) => {
    setFavorites(prev => {
      const isFav = prev.some(f => f.transliteration === nameObj.transliteration);
      if (isFav) {
        return prev.filter(f => f.transliteration !== nameObj.transliteration);
      } else {
        return [...prev, nameObj];
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedName(text);
    setTimeout(() => setCopiedName(null), 2000);
  };

  const shareName = (item: NameResult) => {
    const text = `Check out this beautiful Muslim name: ${item.transliteration} (${item.name}). Meaning: ${item.meaning}. Found via Noor Names.`;
    if (navigator.share) {
      navigator.share({
        title: 'Noor Names',
        text: text,
        url: window.location.href,
      }).catch(console.error);
    } else {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + window.location.href)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const shareApp = () => {
    const text = "Discover beautiful and meaningful Muslim baby names with Noor Names!";
    if (navigator.share) {
      navigator.share({
        title: 'Noor Names',
        text: text,
        url: window.location.href,
      }).catch(console.error);
    } else {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + window.location.href)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const exportToCSV = () => {
    const headers = ["Name", "Transliteration", "Meaning", "Origin", "Gender", "Significance"];
    const rows = results.map(r => [
      r.name,
      r.transliteration,
      r.meaning.replace(/"/g, '""'),
      r.origin,
      r.gender,
      (r.significance || "").replace(/"/g, '""')
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `noor_names_${results.length}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6">
      {/* Header */}
      <header className="text-center mb-12 max-w-2xl relative">
        <button 
          onClick={shareApp}
          className="absolute -top-4 -right-4 p-3 bg-white rounded-full shadow-sm border border-stone-100 text-stone-400 hover:text-emerald-600 transition-all hover:shadow-md"
          title="Share App"
        >
          <Share2 className="w-5 h-5" />
        </button>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-4"
        >
          <div className="relative">
            <Moon className="w-12 h-12 text-emerald-700 fill-emerald-100/50" />
            <Star className="w-4 h-4 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
          </div>
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl sm:text-6xl serif font-medium text-emerald-900 mb-4 tracking-tight"
        >
          Muslim Baby Names Generator
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-stone-600 text-lg serif italic"
        >
          Discover beautiful, meaningful Islamic names for your little one, inspired by tradition and light.
        </motion.p>
      </header>

      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls */}
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-stone-100 space-y-6">
            <h2 className="text-xl serif font-semibold text-stone-800 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Preferences
            </h2>

            {/* Gender Selection */}
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-widest font-semibold text-stone-400">Gender</label>
              <div className="flex p-1 bg-stone-50 rounded-2xl border border-stone-100">
                {(['Boy', 'Girl', 'Both'] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={cn(
                      "flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200",
                      gender === g 
                        ? "bg-white text-emerald-700 shadow-sm border border-stone-100" 
                        : "text-stone-500 hover:text-stone-700"
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Starting Letter */}
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-widest font-semibold text-stone-400">Starting Letter (Optional)</label>
              <input 
                type="text"
                maxLength={1}
                placeholder="e.g. A"
                value={startingLetter}
                onChange={(e) => setStartingLetter(e.target.value.toUpperCase())}
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
              />
            </div>

            {/* Theme/Meaning */}
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-widest font-semibold text-stone-400">Meaning or Theme</label>
              <textarea 
                placeholder="e.g. Brave, Flower, Light, Wisdom..."
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                rows={3}
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all resize-none"
              />
            </div>

            {/* Batch Size */}
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-widest font-semibold text-stone-400">Batch Size</label>
              <select 
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
              >
                <option value={10}>10 Names</option>
                <option value={20}>20 Names</option>
                <option value={30}>30 Names</option>
                <option value={50}>50 Names</option>
              </select>
            </div>

            <button
              onClick={() => generateNames(false)}
              disabled={loading}
              className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-medium py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/10 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Generate New Batch
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

          {/* Favorites Sidebar (Desktop) */}
          <div className="hidden lg:block bg-stone-900 rounded-3xl p-8 text-stone-100 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl serif font-semibold flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
                Favorites
              </h2>
              <span className="text-xs bg-stone-800 px-2 py-1 rounded-full text-stone-400 font-mono">
                {favorites.length}
              </span>
            </div>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {favorites.length === 0 ? (
                <p className="text-stone-500 text-sm italic py-4">No favorites saved yet.</p>
              ) : (
                favorites.map((fav) => (
                  <div key={fav.transliteration} className="group flex items-center justify-between p-3 bg-stone-800/50 rounded-2xl border border-stone-800 hover:border-stone-700 transition-all">
                    <div>
                      <p className="font-medium text-stone-100">{fav.transliteration}</p>
                      <p className="text-[10px] text-stone-500 uppercase tracking-wider">{fav.gender}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => shareName(fav)}
                        className="p-2 text-stone-500 hover:text-emerald-400 transition-colors"
                        title="Share"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => toggleFavorite(fav)}
                        className="p-2 text-stone-500 hover:text-rose-400 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="lg:col-span-8 space-y-6">
          {results.length > 0 && (
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-stone-100 shadow-sm">
              <div className="flex items-center gap-4">
                <span className="text-stone-500 text-sm font-medium">
                  Showing <span className="text-emerald-700 font-bold">{results.length}</span> names
                </span>
                <button 
                  onClick={() => setResults([])}
                  className="text-xs text-stone-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Clear All
                </button>
              </div>
              <button 
                onClick={exportToCSV}
                className="text-xs bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-bold hover:bg-emerald-100 transition-all flex items-center gap-2"
              >
                <Copy className="w-3 h-3" /> Export to CSV
              </button>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {results.length > 0 ? (
              <motion.div 
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {results.map((item, idx) => (
                  <motion.div
                    key={`${item.transliteration}-${idx}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 hover:shadow-md transition-all group relative overflow-hidden"
                  >
                    {/* Background Accent */}
                    <div className={cn(
                      "absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-5 transition-transform group-hover:scale-110",
                      item.gender === 'Boy' ? "bg-blue-500" : item.gender === 'Girl' ? "bg-rose-500" : "bg-emerald-500"
                    )} />

                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div>
                        <h3 className="text-3xl serif font-bold text-emerald-900">{item.name}</h3>
                        <p className="text-xl serif text-stone-700">{item.transliteration}</p>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => copyToClipboard(item.transliteration)}
                          className="p-2 rounded-full hover:bg-stone-50 text-stone-400 hover:text-emerald-600 transition-all"
                          title="Copy name"
                        >
                          {copiedName === item.transliteration ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        </button>
                        <button 
                          onClick={() => shareName(item)}
                          className="p-2 rounded-full hover:bg-stone-50 text-stone-400 hover:text-emerald-600 transition-all"
                          title="Share name"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => toggleFavorite(item)}
                          className={cn(
                            "p-2 rounded-full transition-all",
                            favorites.some(f => f.transliteration === item.transliteration)
                              ? "text-rose-500 bg-rose-50"
                              : "text-stone-400 hover:text-rose-500 hover:bg-stone-50"
                          )}
                        >
                          <Heart className={cn("w-5 h-5", favorites.some(f => f.transliteration === item.transliteration) && "fill-current")} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 relative z-10">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          item.gender === 'Boy' ? "bg-blue-50 text-blue-600" : item.gender === 'Girl' ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                        )}>
                          {item.gender}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-500">
                          {item.origin}
                        </span>
                      </div>
                      
                      <p className="text-stone-600 text-sm leading-relaxed italic">
                        "{item.meaning}"
                      </p>

                      {item.significance && (
                        <div className="pt-3 border-t border-stone-50">
                          <p className="text-[11px] text-stone-400 flex items-start gap-1.5">
                            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            {item.significance}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : !loading && (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-emerald-50/30 rounded-3xl p-12 text-center border border-dashed border-emerald-100"
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <Search className="w-8 h-8 text-emerald-200" />
                </div>
                <h3 className="text-2xl serif font-medium text-emerald-900 mb-2">Start your journey</h3>
                <p className="text-stone-500 max-w-md mx-auto">
                  Adjust your preferences and click generate to discover beautiful names with deep meanings.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 space-y-4"
            >
              <div className="relative">
                <Baby className="w-16 h-16 text-emerald-200 animate-bounce" />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-stone-200 rounded-full blur-sm" />
              </div>
              <p className="serif italic text-stone-500">Consulting the stars for more beautiful names...</p>
            </motion.div>
          )}

          {results.length > 0 && !loading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center pt-8"
            >
              <button
                onClick={() => generateNames(true)}
                className="bg-white border-2 border-emerald-800 text-emerald-800 hover:bg-emerald-50 font-bold py-4 px-12 rounded-2xl transition-all shadow-sm flex items-center gap-2 group"
              >
                Load More Names
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}
        </section>
      </main>

      {/* SEO Informational Section */}
      <section className="mt-24 w-full max-w-4xl space-y-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <h2 className="text-3xl serif font-bold text-emerald-900">Choosing the Perfect Muslim Baby Name</h2>
            <p className="text-stone-600 leading-relaxed">
              In Islam, giving a child a beautiful and meaningful name is considered a primary duty of parents. A name is not just a label; it's a prayer, an identity, and a connection to one's heritage. Our <strong>Muslim Baby Names Generator</strong> uses advanced AI to help you find names that are linguistically accurate and spiritually significant.
            </p>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl serif font-bold text-emerald-900">Why Meaning Matters</h2>
            <p className="text-stone-600 leading-relaxed">
              The Prophet Muhammad (peace be upon him) said: "On the Day of Resurrection, you will be called by your names and by your fathers' names, so give yourselves good names." Whether you are looking for <strong>Islamic boy names</strong> or <strong>Islamic girl names</strong>, the meaning behind the name carries weight and blessings.
            </p>
          </div>
        </div>

        <div className="bg-emerald-50/50 rounded-3xl p-8 sm:p-12 border border-emerald-100">
          <h2 className="text-3xl serif font-bold text-emerald-900 mb-8 text-center">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <h3 className="font-bold text-emerald-800">What are the best Muslim baby names?</h3>
              <p className="text-sm text-stone-600">The best names are those that have positive meanings, such as names of the Prophets, companions of the Prophet, or names that reflect the attributes of Allah (with 'Abd' prefixed).</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-emerald-800">Can I generate names by letter?</h3>
              <p className="text-sm text-stone-600">Yes! Our tool allows you to filter by starting letter, helping you follow family traditions or personal preferences.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-emerald-800">Are these names from the Quran?</h3>
              <p className="text-sm text-stone-600">Many of the names generated are found in the Quran or have roots in Quranic Arabic, ensuring they carry deep spiritual significance.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-emerald-800">How many names can I generate?</h3>
              <p className="text-sm text-stone-600">You can generate batches of up to 50 names at a time and keep loading more until you find the perfect one for your child.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Favorites */}
      <div className="lg:hidden mt-12 w-full max-w-2xl px-4">
        <div className="bg-stone-900 rounded-3xl p-8 text-stone-100 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl serif font-semibold flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
              Favorites
            </h2>
            <span className="text-xs bg-stone-800 px-2 py-1 rounded-full text-stone-400 font-mono">
              {favorites.length}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {favorites.length === 0 ? (
              <p className="col-span-2 text-stone-500 text-sm italic py-4">No favorites saved yet.</p>
            ) : (
              favorites.map((fav) => (
                <div key={fav.transliteration} className="group flex items-center justify-between p-3 bg-stone-800/50 rounded-2xl border border-stone-800">
                  <div>
                    <p className="font-medium text-stone-100 text-sm">{fav.transliteration}</p>
                    <p className="text-[9px] text-stone-500 uppercase tracking-wider">{fav.gender}</p>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => shareName(fav)}
                      className="p-1 text-stone-500 hover:text-emerald-400 transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => toggleFavorite(fav)}
                      className="p-1 text-stone-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Contribution & Prayer Section */}
      <section className="mt-16 w-full max-w-2xl bg-white rounded-3xl p-8 border border-stone-100 shadow-sm text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-emerald-50 rounded-2xl">
            <MessageCircle className="w-6 h-6 text-emerald-700" />
          </div>
        </div>
        <h3 className="text-xl serif font-semibold text-stone-800 mb-2">Support & Community</h3>
        <p className="text-stone-600 serif italic mb-6">
          "The best of people are those that bring most benefit to the rest of mankind."
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
            <p className="text-xs uppercase tracking-widest font-bold text-stone-400 mb-1">Prayer Request</p>
            <p className="text-emerald-900 font-medium">Pray for SM Talha</p>
          </div>
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
            <p className="text-xs uppercase tracking-widest font-bold text-stone-400 mb-1">Contribute</p>
            <div className="flex flex-col items-center">
              <a href="tel:+923132020392" className="text-emerald-900 font-medium hover:underline">+92 313 2020392</a>
              <a href="https://darsenizami.net" target="_blank" rel="noopener noreferrer" className="text-emerald-600 text-sm flex items-center gap-1 hover:underline">
                darsenizami.net <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-12 text-center text-stone-400 text-sm serif italic">
        <p>&copy; {new Date().getFullYear()} Noor Names. May your child be a light in this world.</p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
      `}</style>
    </div>
  );
}
