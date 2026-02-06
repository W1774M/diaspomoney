'use client';

import { Play } from 'lucide-react';
import Image from 'next/image';

interface VideoTestimonial {
  id: string;
  thumbnail: string;
  duration: string;
  userName: string;
  userInitial: string;
  location?: string;
  role: string;
  videoUrl?: string;
  affiliation?: string;
}


export function VideoTestimonialsSection({ videoTestimonials }: { videoTestimonials: VideoTestimonial[] }) {
  const handlePlayClick = (testimonial: VideoTestimonial) => {
    // TODO: Implémenter l'ouverture de la vidéo (modal ou redirection)
    console.log('Play video:', testimonial.id);
  };

  return (
    <section className="py-20 md:py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Title with Play Icon */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-auto h-auto flex items-center justify-center  rounded-full" style={{ padding: '10px' }}>
            <Play className="w-6 h-6" />
          </div>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold"
            style={{
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              color: '#1C1917',
            }}
          >
            Témoignages vidéo
          </h2>
        </div>

        {/* Video Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {videoTestimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-transparent rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => handlePlayClick(testimonial)}
            >
              {/* Video Thumbnail */}
              <div className="relative aspect-square bg-gray-700 rounded-lg overflow-hidden border border-gray-600">
                {/* Thumbnail Image */}
                {testimonial.thumbnail && testimonial.thumbnail.startsWith('/') ? (
                  <Image
                    src={testimonial.thumbnail}
                    alt={`Témoignage de ${testimonial.userName}`}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      // Fallback si l'image n'existe pas
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                    <div className="text-gray-400 text-sm">Miniature vidéo</div>
                  </div>
                )}
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                  <div className="w-16 h-16 bg-[#F97015] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 text-white ml-1" fill="white" />
                  </div>
                </div>

                {/* Duration Badge */}
                <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-white text-xs font-medium">
                  {testimonial.duration}
                </div>
              </div>

              {/* User Info Card */}
              <div className="bg-white rounded-lg p-4 mt-4 flex items-center gap-3">
                {/* User Initial/Avatar */}
                <div className="w-12 h-12 bg-[#F97015] rounded-full flex items-center justify-center flex-shrink-0">
                  <span
                    className="text-white font-bold text-lg"
                    style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                  >
                    {testimonial.userInitial}
                  </span>
                </div>

                {/* User Details */}
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-base font-bold mb-1 truncate"
                    style={{
                      color: '#1C1917',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                  >
                    {testimonial.userName}
                  </h3>
                  {testimonial.location && <p
                    className="text-sm text-gray-600 mb-1"
                    style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                  >
                    {testimonial.location}
                  </p>}
                  {testimonial.affiliation && <p
                    className="text-sm text-gray-600 mb-1"
                    style={{
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                  >
                    {testimonial.affiliation}
                  </p>}
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: '#F97015',
                      fontFamily: 'Plus Jakarta Sans, sans-serif',
                    }}
                  >
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
