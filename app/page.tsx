"use client";

import {
  HeroSection,
  BenefitsSection,
  PartnersSection,
  RoadmapSection,
  TestimonialsSection,
  CareForLovedOnesSection,
  PhotoTestimonialsSection,
} from "@/components/features/home";
import HowItWorks from "@/components/common/HowItWorks";



// interface VideoTestimonial {
//   id: string;
//   thumbnail: string;
//   duration: string;
//   userName: string;
//   userInitial: string;
//   affiliation?: string;
//   location?: string;
//   role: string;
//   videoUrl?: string;
// }

export default function HomePage() {

  
// const VIDEO_TESTIMONIALS: VideoTestimonial[] = [
//   {
//     id: '1',
//     thumbnail: '/img/testimonials/video-1.jpg', // À remplacer par l'image réelle
//     duration: '1:45',
//     userName: 'Ibrahima Diop',
//     userInitial: 'I',
//     location: 'Toulouse, France',
//     role: 'Utilisateur',
//   },
//   {
//     id: '2',
//     thumbnail: '/img/testimonials/video-2.jpg', // À remplacer par l'image réelle
//     duration: '1:45',
//     userName: 'Ibrahima Diop',
//     userInitial: 'I',
//     location: 'Toulouse, France',
//     role: 'Utilisateur',
//   },
//   {
//     id: '3',
//     thumbnail: '/img/testimonials/video-3.jpg', // À remplacer par l'image réelle
//     duration: '1:45',
//     userName: 'Ibrahima Diop',
//     userInitial: 'I',
//     location: 'Toulouse, France',
//     role: 'Utilisateur',
//   },
// ];

// const VIDEO_TESTIMONIALS_2: VideoTestimonial[] = [
//   {
//     id: '1',
//     thumbnail: '/img/testimonials/video-provider-1.jpg',
//     duration: '3:12',
//     userName: 'Dr. Mariama Camara',
//     userInitial: 'M',
//     affiliation: 'Centre Médical Excellence, Conakry',
//     role: 'Directrice médicale',
//   },
//   {
//     id: '2',
//     thumbnail: '/img/testimonials/video-provider-2.jpg',
//     duration: '3:12',
//     userName: 'Dr. Mariama Camara',
//     userInitial: 'M',
//     affiliation: 'Centre Médical Excellence, Conakry',
//     role: 'Directrice médicale',
//   },
//   {
//     id: '3',
//     thumbnail: '/img/testimonials/video-provider-3.jpg',
//     duration: '3:12',
//     userName: 'Dr. Mariama Camara',
//     userInitial: 'M',
//     affiliation: 'Centre Médical Excellence, Conakry',
//     role: 'Directrice médicale',
//   },
// ];


  return (
    <div className="flex flex-col">
      <HeroSection />
      <HowItWorks className="py-20 md:py-24 bg-white relative overflow-hidden" />
      <BenefitsSection />
      {/* <VideoTestimonialsSection videoTestimonials={VIDEO_TESTIMONIALS} />
      <VideoTestimonialsSection videoTestimonials={VIDEO_TESTIMONIALS_2} /> */}
      <TestimonialsSection />
      <PhotoTestimonialsSection />
      <PartnersSection />
      <CareForLovedOnesSection />
      <RoadmapSection />
    </div>
  );
}
