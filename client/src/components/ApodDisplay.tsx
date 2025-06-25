// FILE: client/src/components/ApodDisplay.tsx
"use client";

// Define the shape of the data we expect to receive
export interface ApodData {
    title: string;
    explanation: string;
    url: string;
    media_type: 'image' | 'video';
}

interface ApodDisplayProps {
    data: ApodData;   
}

const ApodDisplay = ({ data }: ApodDisplayProps) => {
    return (
        <div className="max-w-4xl p-4 mt-8 text-white bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
            <h2 className="mb-4 text-3xl font-bold text-purple-300">{data.title}</h2>
            {data.media_type === 'image' ? (
                <img src={data.url} alt={data.title} className="w-full rounded-lg" />
            ) : (
                <iframe src={data.url} allowFullScreen className="w-full h-96 rounded-lg"></iframe>   
            )}
            <p className="mt-4 text-lg text-gray-300">{data.explanation}</p>
        </div>
    );  
};

export default ApodDisplay;