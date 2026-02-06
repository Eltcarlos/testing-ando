import type { UploadedVideo } from '@/types/admin';

// Mock uploaded videos for development
export const mockVideos: UploadedVideo[] = [
  {
    id: 'video-1',
    fileName: 'introduccion-contabilidad-basica.mp4',
    url: 'https://example-bucket.s3.amazonaws.com/videos/introduccion-contabilidad-basica.mp4',
    size: 45678900, // ~45.7 MB
    uploadedAt: new Date('2024-11-15'),
    thumbnail: 'https://picsum.photos/seed/video1/320/180',
    duration: '12:34',
  },
  {
    id: 'video-2',
    fileName: 'marketing-digital-redes-sociales.mp4',
    url: 'https://example-bucket.s3.amazonaws.com/videos/marketing-digital-redes-sociales.mp4',
    size: 67890120, // ~67.9 MB
    uploadedAt: new Date('2024-11-20'),
    thumbnail: 'https://picsum.photos/seed/video2/320/180',
    duration: '18:45',
  },
  {
    id: 'video-3',
    fileName: 'gestion-recursos-humanos-intro.mp4',
    url: 'https://example-bucket.s3.amazonaws.com/videos/gestion-recursos-humanos-intro.mp4',
    size: 52341000, // ~52.3 MB
    uploadedAt: new Date('2024-11-22'),
    thumbnail: 'https://picsum.photos/seed/video3/320/180',
    duration: '15:20',
  },
  {
    id: 'video-4',
    fileName: 'estrategias-ventas-b2b.mp4',
    url: 'https://example-bucket.s3.amazonaws.com/videos/estrategias-ventas-b2b.mp4',
    size: 38920000, // ~38.9 MB
    uploadedAt: new Date('2024-11-25'),
    thumbnail: 'https://picsum.photos/seed/video4/320/180',
    duration: '10:15',
  },
  {
    id: 'video-5',
    fileName: 'transformacion-digital-empresas.mp4',
    url: 'https://example-bucket.s3.amazonaws.com/videos/transformacion-digital-empresas.mp4',
    size: 71234500, // ~71.2 MB
    uploadedAt: new Date('2024-11-28'),
    thumbnail: 'https://picsum.photos/seed/video5/320/180',
    duration: '22:10',
  },
  {
    id: 'video-6',
    fileName: 'aspectos-legales-emprendedores.mp4',
    url: 'https://example-bucket.s3.amazonaws.com/videos/aspectos-legales-emprendedores.mp4',
    size: 43210000, // ~43.2 MB
    uploadedAt: new Date('2024-12-01'),
    thumbnail: 'https://picsum.photos/seed/video6/320/180',
    duration: '14:30',
  },
  {
    id: 'video-7',
    fileName: 'liderazgo-equipos-alto-rendimiento.mp4',
    url: 'https://example-bucket.s3.amazonaws.com/videos/liderazgo-equipos-alto-rendimiento.mp4',
    size: 58900000, // ~58.9 MB
    uploadedAt: new Date('2024-12-05'),
    thumbnail: 'https://picsum.photos/seed/video7/320/180',
    duration: '16:55',
  },
  {
    id: 'video-8',
    fileName: 'optimizacion-procesos-operativos.mp4',
    url: 'https://example-bucket.s3.amazonaws.com/videos/optimizacion-procesos-operativos.mp4',
    size: 49870000, // ~49.9 MB
    uploadedAt: new Date('2024-12-08'),
    thumbnail: 'https://picsum.photos/seed/video8/320/180',
    duration: '13:40',
  },
];

// Helper function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Helper function to get video by ID
export function getMockVideoById(id: string): UploadedVideo | undefined {
  return mockVideos.find(video => video.id === id);
}

// Helper function to filter videos
export function filterMockVideos(search: string = ''): UploadedVideo[] {
  return mockVideos.filter(video =>
    video.fileName.toLowerCase().includes(search.toLowerCase())
  );
}
