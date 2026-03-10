/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wand2, 
  Image as ImageIcon, 
  Loader2, 
  Download, 
  RefreshCw,
  Sparkles,
  FileText,
  RotateCcw
} from 'lucide-react';
import { generateConcepts, generateImage, ImageConcept } from './services/gemini';

export default function App() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [postText, setPostText] = useState(() => {
    try { return localStorage.getItem('postText') || ''; } catch (e) { return ''; }
  });
  const [isGeneratingConcepts, setIsGeneratingConcepts] = useState(false);
  const [concepts, setConcepts] = useState<ImageConcept[]>(() => {
    try {
      const saved = localStorage.getItem('concepts');
      return saved ? JSON.parse(saved) || [] : [];
    } catch (e) {
      console.error("Failed to parse concepts", e);
      return [];
    }
  });
  // Do not store generated images in localStorage as base64 strings easily exceed the 5MB quota
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [generatingImageId, setGeneratingImageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try { localStorage.setItem('postText', postText); } catch (e) {}
  }, [postText]);

  useEffect(() => {
    try { localStorage.setItem('concepts', JSON.stringify(concepts)); } catch (e) {}
  }, [concepts]);

  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } else {
        setHasKey(true); // Fallback if not in AI Studio environment
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if ((window as any).aistudio && (window as any).aistudio.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      // Assume success to mitigate race condition
      setHasKey(true);
    }
  };

  const handleGenerateConcepts = async () => {
    if (!postText.trim()) return;
    
    setIsGeneratingConcepts(true);
    setError(null);
    try {
      const newConcepts = await generateConcepts(postText);
      setConcepts(newConcepts);
      setGeneratedImages({});
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate concepts. Please try again.");
    } finally {
      setIsGeneratingConcepts(false);
    }
  };

  const handleGenerateImage = async (concept: ImageConcept) => {
    setGeneratingImageId(concept.id);
    setError(null);
    try {
      const imageUrl = await generateImage(concept.prompt, concept.style, concept.aspectRatio);
      setGeneratedImages(prev => ({ ...prev, [concept.id]: imageUrl }));
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("Requested entity was not found")) {
        setHasKey(false); // Prompt for key again
        setError("API Key error. Please re-select your API key.");
      } else {
        setError(`Failed to generate image for "${concept.title}". ${err.message}`);
      }
    } finally {
      setGeneratingImageId(null);
    }
  };

  const handleReset = () => {
    setPostText('');
    setConcepts([]);
    setGeneratedImages({});
    setError(null);
  };

  if (hasKey === null) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-zinc-900 w-8 h-8" />
      </div>
    );
  }

  if (hasKey === false) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-zinc-200 max-w-md w-full text-center">
          <Sparkles className="w-12 h-12 text-zinc-900 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">High-Quality Image Generation</h2>
          <p className="text-zinc-600 mb-6">
            This app uses Gemini's highest quality image models to generate professional LinkedIn assets. 
            To continue, please select a paid Google Cloud API key.
            <br/><br/>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-zinc-900 font-medium hover:underline">
              Learn more about billing
            </a>
          </p>
          <button
            onClick={handleSelectKey}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-3 px-4 rounded-xl transition-colors shadow-sm"
          >
            Select API Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans selection:bg-zinc-200 selection:text-zinc-900">
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Sparkles size={16} />
            </div>
            <h1 className="font-semibold text-lg tracking-tight">Vikas's Creative Asset Generator</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Input */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="text-zinc-900" size={20} />
                  <h2 className="font-medium text-lg">Your Post</h2>
                </div>
                {concepts.length > 0 && (
                  <button
                    onClick={handleReset}
                    className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                    title="Reset Canvas"
                  >
                    <RotateCcw size={18} />
                  </button>
                )}
              </div>
              <p className="text-sm text-zinc-500 mb-4">
                Paste your LinkedIn post below. We'll analyze it and suggest 4 unique visual concepts to accompany it.
              </p>
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="I'm excited to announce..."
                className="w-full h-64 p-4 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 resize-none text-sm transition-all"
              />
              <button
                onClick={handleGenerateConcepts}
                disabled={!postText.trim() || isGeneratingConcepts}
                className="mt-4 w-full bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {isGeneratingConcepts ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Analyzing Post...
                  </>
                ) : (
                  <>
                    <Wand2 size={18} />
                    Generate Concepts
                  </>
                )}
              </button>
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Concepts & Images */}
          <div className="lg:col-span-8">
            {concepts.length === 0 && !isGeneratingConcepts ? (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-zinc-400 border-2 border-dashed border-zinc-200 rounded-2xl bg-white/50">
                <ImageIcon size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium text-zinc-600">No concepts yet</p>
                <p className="text-sm">Paste your post and generate ideas to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                  {concepts.map((concept, index) => (
                    <motion.div
                      key={concept.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden flex flex-col ${index === 4 ? 'md:col-span-2' : ''}`}
                    >
                      {/* Image Area */}
                      <div 
                        className={`bg-zinc-100 relative border-b border-zinc-200 flex items-center justify-center overflow-hidden group ${index === 4 ? 'aspect-square md:aspect-[2/1]' : 'aspect-square'}`}
                      >
                        {generatingImageId === concept.id ? (
                          <div className="flex flex-col items-center text-zinc-500">
                            <Loader2 size={32} className="animate-spin mb-3 text-zinc-900" />
                            <span className="text-sm font-medium">Generating Asset...</span>
                          </div>
                        ) : generatedImages[concept.id] ? (
                          <>
                            <img 
                              src={generatedImages[concept.id]} 
                              alt={concept.title} 
                              className="w-full h-full object-contain bg-zinc-100 p-2"
                            />
                            <div className="absolute inset-0 bg-zinc-900/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-4">
                              <a 
                                href={generatedImages[concept.id]} 
                                download={`${concept.style.replace(/\s+/g, '-').toLowerCase()}-asset.png`}
                                className="bg-white text-zinc-900 p-3 rounded-full hover:scale-110 transition-transform shadow-xl"
                                title="Download Image"
                              >
                                <Download size={20} />
                              </a>
                              <button 
                                onClick={() => handleGenerateImage(concept)}
                                className="bg-white text-zinc-900 p-3 rounded-full hover:scale-110 transition-transform shadow-xl"
                                title="Regenerate Image"
                              >
                                <RefreshCw size={20} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center text-zinc-400 p-6 text-center">
                            <ImageIcon size={48} className="mb-3 opacity-30" />
                            <p className="text-sm">Ready to generate</p>
                            <p className="text-xs mt-1 opacity-70">Ratio: {concept.aspectRatio}</p>
                          </div>
                        )}
                      </div>

                      {/* Content Area */}
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h3 className="font-semibold text-zinc-900 leading-tight">{concept.title}</h3>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 text-zinc-800 whitespace-nowrap border border-zinc-200">
                            {concept.style}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-500 mb-4 flex-1">
                          {concept.description}
                        </p>
                        
                        {!generatedImages[concept.id] && (
                          <button
                            onClick={() => handleGenerateImage(concept)}
                            disabled={generatingImageId !== null}
                            className="w-full mt-auto bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-300 text-white font-medium py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
                          >
                            <Sparkles size={16} />
                            Generate Image
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
