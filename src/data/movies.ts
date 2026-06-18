// Bundled catalog of REAL, freely-licensed films:
//  - Blender Foundation open movies (CC-BY) — with playable trailers
//  - Public-domain classics
// Posters are stable Wikimedia URLs; trailers are stable mp4s on download.blender.org.
export type Movie = {
  id: string;
  title: string;
  year: number;
  rating: number; // 0-10
  duration: string;
  genres: string[];
  maturity: string;
  description: string;
  poster: string;
  backdrop: string;
  trailer?: string; // real mp4 stream (optional)
  episodeNumber?: number; // set when this Movie is a series episode
  episodeTitle?: string;
};

export const GENRES = [
  'All',
  'Animation',
  'Sci-Fi',
  'Fantasy',
  'Comedy',
  'Drama',
  'Horror',
  'Adventure',
];

const W = 'https://upload.wikimedia.org/wikipedia';

export const MOVIES: Movie[] = [
  {
    id: 'm1',
    title: 'Sintel',
    year: 2010,
    rating: 8.9,
    duration: '14m 48s',
    genres: ['Animation', 'Fantasy', 'Adventure'],
    maturity: '12+',
    description:
      'A lonely young woman, Sintel, helps and befriends a baby dragon she names Scales — and embarks on a dangerous quest to find him again. Blender Foundation’s third open movie.',
    poster: `${W}/commons/thumb/8/8f/Sintel_poster.jpg/500px-Sintel_poster.jpg`,
    backdrop: `${W}/commons/thumb/8/8f/Sintel_poster.jpg/500px-Sintel_poster.jpg`,
    trailer: 'https://download.blender.org/durian/trailer/sintel_trailer-720p.mp4',
  },
  {
    id: 'm2',
    title: 'Big Buck Bunny',
    year: 2008,
    rating: 8.2,
    duration: '9m 56s',
    genres: ['Animation', 'Comedy'],
    maturity: 'All',
    description:
      'A big, good-natured rabbit takes gentle revenge on three rodents who bully the forest’s smaller creatures. The famous Peach open movie.',
    poster: `${W}/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/500px-Big_buck_bunny_poster_big.jpg`,
    backdrop: `${W}/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/500px-Big_buck_bunny_poster_big.jpg`,
    trailer: 'https://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4',
  },
  {
    id: 'm3',
    title: 'Tears of Steel',
    year: 2012,
    rating: 7.8,
    duration: '12m 14s',
    genres: ['Sci-Fi', 'Adventure'],
    maturity: '12+',
    description:
      'In a future Amsterdam, a group of soldiers and scientists try to save the world from destructive robots by reaching into the past. A live-action + VFX open movie.',
    poster: `${W}/commons/thumb/7/70/Tos-poster.png/500px-Tos-poster.png`,
    backdrop: `${W}/commons/thumb/7/70/Tos-poster.png/500px-Tos-poster.png`,
  },
  {
    id: 'm4',
    title: 'Elephants Dream',
    year: 2006,
    rating: 7.3,
    duration: '10m 54s',
    genres: ['Animation', 'Sci-Fi'],
    maturity: '7+',
    description:
      'Two characters, Proog and Emo, explore a strange and dangerous mechanical world. The world’s first open movie.',
    poster: `${W}/commons/thumb/0/0c/ElephantsDreamPoster.jpg/500px-ElephantsDreamPoster.jpg`,
    backdrop: `${W}/commons/thumb/0/0c/ElephantsDreamPoster.jpg/500px-ElephantsDreamPoster.jpg`,
  },
  {
    id: 'm5',
    title: 'Cosmos Laundromat',
    year: 2015,
    rating: 7.6,
    duration: '12m 10s',
    genres: ['Animation', 'Comedy', 'Drama'],
    maturity: '12+',
    description:
      'A suicidal sheep named Franck meets a salesman who offers him the gift of a lifetime — across infinite parallel realities.',
    poster: `${W}/commons/thumb/c/c5/CosmosLaundromatPoster.jpg/500px-CosmosLaundromatPoster.jpg`,
    backdrop: `${W}/commons/thumb/c/c5/CosmosLaundromatPoster.jpg/500px-CosmosLaundromatPoster.jpg`,
  },
  {
    id: 'm6',
    title: 'Spring',
    year: 2019,
    rating: 8.0,
    duration: '7m 47s',
    genres: ['Animation', 'Fantasy', 'Drama'],
    maturity: '7+',
    description:
      'A shepherd girl and her dog face ancient spirits to continue the cycle of life. A hand-crafted Blender open movie.',
    poster: `${W}/commons/thumb/0/05/Spring2019PillarPosterBlender.jpg/500px-Spring2019PillarPosterBlender.jpg`,
    backdrop: `${W}/commons/thumb/0/05/Spring2019PillarPosterBlender.jpg/500px-Spring2019PillarPosterBlender.jpg`,
  },
  {
    id: 'm7',
    title: 'Caminandes: Llamigos',
    year: 2016,
    rating: 7.9,
    duration: '2m 30s',
    genres: ['Animation', 'Comedy'],
    maturity: 'All',
    description:
      'Koro the llama and Oti the penguin battle over food in the freezing Patagonian winter. A charming open-movie short.',
    poster: `${W}/commons/thumb/6/61/Pablo_Vazquez_-_Caminandes_-_Episode_1_-_Llama_Drama_-_Cover_thumbnail.png/500px-Pablo_Vazquez_-_Caminandes_-_Episode_1_-_Llama_Drama_-_Cover_thumbnail.png`,
    backdrop: `${W}/commons/thumb/6/61/Pablo_Vazquez_-_Caminandes_-_Episode_1_-_Llama_Drama_-_Cover_thumbnail.png/500px-Pablo_Vazquez_-_Caminandes_-_Episode_1_-_Llama_Drama_-_Cover_thumbnail.png`,
  },
  {
    id: 'm8',
    title: 'Nosferatu',
    year: 1922,
    rating: 7.9,
    duration: '1h 34m',
    genres: ['Horror', 'Fantasy'],
    maturity: '16+',
    description:
      'Thomas Hutter travels to the castle of the mysterious Count Orlok, unleashing a plague of vampirism upon his town. F. W. Murnau’s silent masterpiece.',
    poster: `${W}/en/thumb/9/90/Nosferatu_poster_%28Albin_Grau%2C_1922%29_1.jpg/500px-Nosferatu_poster_%28Albin_Grau%2C_1922%29_1.jpg`,
    backdrop: `${W}/en/thumb/9/90/Nosferatu_poster_%28Albin_Grau%2C_1922%29_1.jpg/500px-Nosferatu_poster_%28Albin_Grau%2C_1922%29_1.jpg`,
  },
  {
    id: 'm9',
    title: 'The Cabinet of Dr. Caligari',
    year: 1920,
    rating: 8.0,
    duration: '1h 16m',
    genres: ['Horror', 'Fantasy'],
    maturity: '12+',
    description:
      'A hypnotist uses a sleepwalker to commit murders in a German town. A defining work of German Expressionist cinema.',
    poster: `${W}/commons/thumb/5/52/Das_Cabinet_des_Dr._Caligari.JPG/500px-Das_Cabinet_des_Dr._Caligari.JPG`,
    backdrop: `${W}/commons/thumb/5/52/Das_Cabinet_des_Dr._Caligari.JPG/500px-Das_Cabinet_des_Dr._Caligari.JPG`,
  },
  {
    id: 'm10',
    title: 'A Trip to the Moon',
    year: 1902,
    rating: 8.1,
    duration: '13m',
    genres: ['Sci-Fi', 'Adventure'],
    maturity: 'All',
    description:
      'A group of astronomers travel to the Moon in a cannon-propelled capsule. Georges Méliès’ pioneering science-fiction film.',
    poster: `${W}/commons/0/04/Le_Voyage_dans_la_lune.jpg`,
    backdrop: `${W}/commons/0/04/Le_Voyage_dans_la_lune.jpg`,
  },
  {
    id: 'm11',
    title: 'Plan 9 from Outer Space',
    year: 1959,
    rating: 4.0,
    duration: '1h 19m',
    genres: ['Sci-Fi', 'Horror'],
    maturity: '12+',
    description:
      'Aliens resurrect the dead to stop humanity from creating a doomsday weapon. Ed Wood’s cult classic, often called “the worst film ever made.”',
    poster: `${W}/commons/thumb/b/bf/Plan_9_Alternative_poster.jpg/500px-Plan_9_Alternative_poster.jpg`,
    backdrop: `${W}/commons/thumb/b/bf/Plan_9_Alternative_poster.jpg/500px-Plan_9_Alternative_poster.jpg`,
  },
  {
    id: 'm12',
    title: 'Metropolis',
    year: 1927,
    rating: 8.3,
    duration: '2h 33m',
    genres: ['Sci-Fi', 'Drama'],
    maturity: '12+',
    description:
      'In a futuristic city sharply divided between workers and planners, the son of the city’s ruler falls for a working-class prophet. Fritz Lang’s monumental epic.',
    poster: `${W}/en/thumb/9/97/Metropolis_%28German_three-sheet_poster%29.jpg/500px-Metropolis_%28German_three-sheet_poster%29.jpg`,
    backdrop: `${W}/en/thumb/9/97/Metropolis_%28German_three-sheet_poster%29.jpg/500px-Metropolis_%28German_three-sheet_poster%29.jpg`,
  },
];

export const FEATURED = MOVIES[0]; // Sintel — has a real trailer

export const ROWS: { title: string; movieIds: string[] }[] = [
  { title: 'Trending Now', movieIds: ['m1', 'm3', 'm6', 'm2', 'm12'] },
  { title: 'Blender Open Movies', movieIds: ['m1', 'm2', 'm4', 'm5', 'm6', 'm7'] },
  { title: 'Sci-Fi & Fantasy', movieIds: ['m3', 'm1', 'm10', 'm12', 'm6'] },
  { title: 'Timeless Classics', movieIds: ['m8', 'm9', 'm10', 'm11', 'm12'] },
  { title: 'Made for You', movieIds: ['m2', 'm7', 'm5', 'm1', 'm3'] },
];

export const getMovie = (id: string) => MOVIES.find((m) => m.id === id);
