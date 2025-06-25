// FILE: src/components/ArtworkGallery.tsx
"use client";

import { useState, useEffect } from 'react';
import Pagination from './Pagination';

interface Artwork {
  id: string;
  name: string;
  imageUrl: string;
  satelliteName: string;
  createdAt: string;
}

interface TleData {
    name: string;
}

const ARTWORKS_PER_PAGE = 9;

const ArtworkGallery = () => {
  const [galleryData, setGalleryData] = useState<{
    artworks: Artwork[];
    currentPage: number;
    totalPages: number;
  }>({
    artworks: [],
    currentPage: 1,
    totalPages: 1,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [satelliteList, setSatelliteList] = useState<TleData[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all'); // 'all' or a satellite name

  // Effect to fetch the list of satellites for the dropdown
  useEffect(() => {
      const fetchSatellites = async () => {
          try {
              const res = await fetch('http://localhost:3001/api/tle-data/gnss');
              if (!res.ok) throw new Error('Failed to fetch satellite list.');
              setSatelliteList(await res.json());
          } catch (err) {
              console.error(err);
              // Handle error silently for the filter list
          }
      };
      fetchSatellites();
  }, []);

  // Effect to fetch the artworks when page or filter changes
  useEffect(() => {
    const fetchGallery = async () => {
      setIsLoading(true);
      setError(null);
      
      // Build the API URL dynamically
      let url = `http://localhost:3001/api/art/gallery?page=${currentPage}&limit=${ARTWORKS_PER_PAGE}`;
      if (selectedFilter !== 'all') {
          url += `&satelliteName=${encodeURIComponent(selectedFilter)}`;
      }

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch the gallery.');
        const data = await res.json();
        setGalleryData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGallery();
  }, [currentPage, selectedFilter]);

  // When the filter changes, reset to the first page
  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedFilter(event.target.value);
      setCurrentPage(1); // Go back to page 1 for the new filter
  };

  return (
    <div>
        <div className="flex justify-end mb-8">
            <div className="w-full max-w-xs">
                <label htmlFor="filter-select" className="sr-only">Filter by satellite</label>
                <select 
                    id="filter-select"
                    value={selectedFilter}
                    onChange={handleFilterChange}
                    className="custom-select w-full p-3 bg-primary-deep/50 border border-primary-vibrant rounded-md text-white focus:ring-2 focus:ring-primary-accent focus:border-primary-accent appearance-none text-center cursor-pointer"
                >
                    <option value="all">All Satellites</option>
                    {satelliteList.map(sat => (
                        <option key={sat.name} value={sat.name}>{sat.name}</option>
                    ))}
                </select>
            </div>
        </div>

        {isLoading && <p className="text-center text-lg text-gray-400">Loading Gallery...</p>}
        {error && <p className="text-center text-red-400">Error: {error}</p>}
        
        {!isLoading && !error && galleryData.artworks.length === 0 && (
            <p className="text-center text-gray-400">No artworks found for this filter.</p>
        )}
        
        {!isLoading && !error && galleryData.artworks.length > 0 && (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {galleryData.artworks.map((art) => (
                    <div
                        key={art.id}
                        className="bg-primary-dark/50 border border-primary-deep rounded-lg shadow-lg overflow-hidden group transition-all duration-300 hover:border-primary-accent/50 hover:shadow-2xl hover:shadow-primary-vibrant/10"
                    >
                        <div className="overflow-hidden">
                            <img
                                src={art.imageUrl}
                                alt={art.name}
                                className="w-full h-64 object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
                            />
                        </div>
                        <div className="p-5">
                            <h3 className="text-lg font-bold text-white truncate">{art.name}</h3>
                            <p className="text-sm text-primary-accent/80 mt-1">
                                Based on: {art.satelliteName}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        )}
        
        <Pagination 
            currentPage={galleryData.currentPage}
            totalPages={galleryData.totalPages}
            onPageChange={(page) => setCurrentPage(page)}
        />
    </div>
  );
};

export default ArtworkGallery;