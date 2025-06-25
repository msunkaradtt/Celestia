// FILE: src/components/QueueStatus.tsx
"use client";

interface QueueStatusProps {
    queueStatus: {
        waiting: number;
        active: number;
    } | null;
}

const QueueStatus = ({ queueStatus }: QueueStatusProps) => {
    if (!queueStatus || (queueStatus.waiting === 0 && queueStatus.active === 0)) {
        return null; // Don't show anything if the queue is empty
    }

    const totalInQueue = queueStatus.waiting + queueStatus.active;
    // Rough estimation: ~45 seconds per job (adjust as needed based on your GPU speed)
    const estimatedWaitSeconds = (queueStatus.waiting * 45) + (queueStatus.active ? 20 : 0);
    const estimatedWaitMinutes = Math.ceil(estimatedWaitSeconds / 60);

    return (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm animate-fade-in">
            <div className="bg-primary-deep border border-primary-vibrant rounded-lg shadow-2xl p-4 text-white">
                <div className="flex items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-accent mr-3"></div>
                    <div>
                        <p className="font-bold">Processing Queue</p>
                        <p className="text-sm text-gray-300">
                            {queueStatus.active > 0 ? 'Artwork is currently being generated.' : 'Your request is in the queue.'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            {totalInQueue} request(s) in queue.
                            {estimatedWaitMinutes > 0 && ` Approx. ${estimatedWaitMinutes} min wait.`}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QueueStatus;