// FILE: src/components/ArtGenerationModal.tsx
"use client";

import { useState } from 'react';

// Define the shape of the data for the modal
export interface ArtGenerationParams {
  imageName: string;
  prompt: string;
  negativePrompt: string;
}
interface ArtGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: ArtGenerationParams) => void;
  isGenerating: boolean;
}

// Curated list of high-quality sample prompts
const samplePrompts = [
  { label: 'Cosmic Path', value: 'The glowing trajectory of a lone satellite, leaving a shimmering trail of cosmic dust, hyperdetailed, 8k, cinematic' },
  { label: 'Energy Beam', value: 'A powerful beam of pure energy, a laser carving through the void, lens flare, vibrant plasma, intense glow' },
  { label: 'Japanese Ink Wash', value: 'A single, expressive brush stroke of a Japanese sumi-e painting, made of black ink and gold dust, on textured washi paper' },
  { label: 'Comet\'s Tail', value: 'A comet\'s tail streaking through a vibrant nebula, the path illuminated by distant stars, astrophotography masterpiece' },
  { label: 'Mythical Thread', value: 'A golden thread of destiny, weaving through the tapestry of space and time, mystical, shimmering, elegant' },
];

const sampleNegativePrompts = [
    { label: 'Standard', value: 'ugly, deformed, disfigured, blurry, low quality, pixelated, noisy, text, watermark, signature, artist name, human, person, face, frame, border' },
    { label: 'No People', value: 'human, person, man, woman, face, hands, people' },
    { label: 'Photo-Realism', value: 'painting, drawing, illustration, cartoon, anime, sketch' },
    { label: 'Abstract', value: 'photograph, realistic, real life, landscape, building, car' },
];


const ArtGenerationModal = ({ isOpen, onClose, onSubmit, isGenerating }: ArtGenerationModalProps) => {
  const [params, setParams] = useState<ArtGenerationParams>({
    imageName: '',
    prompt: samplePrompts[0].value,
    negativePrompt: sampleNegativePrompts[0].value
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(params);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setParams(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const { name, value } = e.target;
      // If the user selects the placeholder, do nothing.
      if (value === "") return;
      setParams(prev => ({ ...prev, [name]: value}));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-primary-dark border border-primary-deep p-6 rounded-lg shadow-2xl w-full max-w-2xl text-white m-4">
        <h2 className="text-2xl font-bold mb-6 text-primary-accent">Customize Artwork</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="imageName" className="block mb-2 text-sm font-medium text-gray-300">Artwork Name</label>
            <input type="text" id="imageName" name="imageName" value={params.imageName} onChange={handleInputChange} className="w-full p-2 bg-primary-deep/40 border border-primary-deep rounded-md focus:ring-primary-vibrant focus:border-primary-vibrant" required />
          </div>
          
          <div>
            <label htmlFor="prompt" className="block mb-2 text-sm font-medium text-gray-300">Prompt</label>
            <div className="flex gap-2">
                <textarea id="prompt" name="prompt" value={params.prompt} onChange={handleInputChange} rows={4} className="w-2/3 p-2 bg-primary-deep/40 border border-primary-deep rounded-md focus:ring-primary-vibrant focus:border-primary-vibrant" />
                {/* --- THE FIX: The `value` prop is now set --- */}
                <select name="prompt" value={params.prompt} onChange={handleSelectChange} className="custom-select w-1/3 p-2 bg-primary-deep/40 border border-primary-deep rounded-md text-gray-300 focus:ring-primary-vibrant focus:border-primary-vibrant">
                    <option value="">-- Select a Style --</option>
                    {samplePrompts.map(p => <option key={p.label} value={p.value}>{p.label}</option>)}
                </select>
            </div>
          </div>

          <div>
            <label htmlFor="negativePrompt" className="block mb-2 text-sm font-medium text-gray-300">Negative Prompt</label>
            <div className="flex gap-2">
                <textarea id="negativePrompt" name="negativePrompt" value={params.negativePrompt} onChange={handleInputChange} rows={2} className="w-2/3 p-2 bg-primary-deep/40 border border-primary-deep rounded-md focus:ring-primary-vibrant focus:border-primary-vibrant" />
                 {/* --- THE FIX: The `value` prop is now set --- */}
                 <select name="negativePrompt" value={params.negativePrompt} onChange={handleSelectChange} className="custom-select w-1/3 p-2 bg-primary-deep/40 border border-primary-deep rounded-md text-gray-300 focus:ring-primary-vibrant focus:border-primary-vibrant">
                    <option value="">-- Select a Preset --</option>
                    {sampleNegativePrompts.map(p => <option key={p.label} value={p.value}>{p.label}</option>)}
                </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm bg-transparent border border-gray-600 rounded-md hover:bg-gray-700 hover:border-gray-500 transition-colors">Cancel</button>
            <button type="submit" disabled={isGenerating} className="px-5 py-2 text-sm font-bold bg-primary-accent text-primary-dark rounded-md hover:bg-white transition-all duration-300 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed">
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ArtGenerationModal;