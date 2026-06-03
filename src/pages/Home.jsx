import React, { useState, useEffect } from 'react';
import './Home.css';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ContentSection from '../components/ContentSection';
import HeroCarousel from '../components/HeroCarousel';
import OTTPlatformStrip from '../components/OTTPlatformStrip';

const TMDB_KEY = '1fa448de74c5dac88e0d31d99c7e916d';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const HERO_IMG_BASE = 'https://image.tmdb.org/t/p/original';

export default function Home() {
  const navigate = useNavigate();

  // Restore scroll position when returning from SeeAll or a detail page
  useEffect(() => {
    const savedScroll = sessionStorage.getItem('cinestream_home_scroll');
    if (savedScroll) {
      const y = parseInt(savedScroll, 10);
      sessionStorage.removeItem('cinestream_home_scroll');
      // Small delay to let the page render before scrolling
      requestAnimationFrame(() => {
        window.scrollTo({ top: y, behavior: 'instant' });
      });
    }
  }, []);


  const [heroSlides, setHeroSlides] = useState([]);
  const [kdrama, setKdrama] = useState([]);
  const [bollywood, setBollywood] = useState([]);
  const [hollywood, setHollywood] = useState([]);
  const [animatedFilm, setAnimatedFilm] = useState([]);
  const [anime, setAnime] = useState([]);
  const [action, setAction] = useState([]);
  const [scifi, setScifi] = useState([]);
  const [punjabi, setPunjabi] = useState([]);
  const [romance, setRomance] = useState([]);
  const [unrestrictedRomance, setUnrestrictedRomance] = useState(
    () => localStorage.getItem('cinestream_romance_unrestricted') === 'true'
  );

  // Identify if this is the tayyab4855 account
  const sessionUser = sessionStorage.getItem('cinestream_user') || '';
  const isTayyab = sessionUser.toLowerCase() === 'tayyab4855';

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const userSession = sessionStorage.getItem('cinestream_user') || '';
        const adultEnabled = localStorage.getItem(`cinestream_adult_enabled_${userSession}`) === 'true';
        const isTayyabUser = userSession.toLowerCase() === 'tayyab4855';
        const adultParam = adultEnabled ? '&include_adult=true' : '&include_adult=false';
        const movieCertParam = adultEnabled ? '' : '&certification_country=US&certification.lte=PG-13';

        // Build parallel fetch list — Romance (genre 10749) only for tayyab4855
        const fetchList = [
          fetch(`https://api.themoviedb.org/3/trending/all/day?api_key=${TMDB_KEY}${adultParam}`),
          fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_KEY}&with_original_language=ko&sort_by=popularity.desc${adultParam}`),
          fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&with_original_language=hi&sort_by=popularity.desc${adultParam}${movieCertParam}`),
          fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&with_original_language=en&sort_by=popularity.desc${adultParam}${movieCertParam}`),
          fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&with_genres=16&sort_by=popularity.desc${adultParam}${movieCertParam}`),
          fetch(`https://api.themoviedb.org/3/discover/tv?api_key=${TMDB_KEY}&with_genres=16&with_original_language=ja&sort_by=popularity.desc${adultParam}`),
          fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&with_genres=28&sort_by=popularity.desc${adultParam}${movieCertParam}`),
          fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&with_genres=878&sort_by=popularity.desc${adultParam}${movieCertParam}`),
          fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&with_original_language=pa&sort_by=popularity.desc${adultParam}${movieCertParam}`),
          // Romance: always include adult content (genre 10749), only fetched for tayyab4855
          isTayyabUser && adultEnabled
            ? fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_KEY}&with_genres=10749&sort_by=popularity.desc&include_adult=true&page=1`)
            : Promise.resolve(null),
        ];

        const [
          trendingRes,
          kdramaRes,
          bollywoodRes,
          hollywoodRes,
          animatedRes,
          animeRes,
          actionRes,
          scifiRes,
          punjabiRes,
          romanceRes,
        ] = await Promise.all(fetchList);

        const adultKeywords = ['sex', 'fuck', 'fucked', 'adult', '18+', 'erotic', 'porn', 'nude', 'sexually', 'romance'];
        const containsAdultWord = (text) => {
          if (!text) return false;
          const lower = text.toLowerCase();
          return adultKeywords.some(word => lower.includes(word));
        };


        const formatTMDB = (results, applyKeywordFilter = true) => results?.filter(m => {
          if (adultEnabled) return true;
          if (m.adult === true) return false;
          if (applyKeywordFilter) {
            if (containsAdultWord(m.title) || containsAdultWord(m.name) || containsAdultWord(m.overview)) {
              return false;
            }
          }
          return true;
        }).slice(0, 18).map(m => ({
          id: m.id,
          title: m.title || m.name,
          poster: m.poster_path ? `${IMG_BASE}${m.poster_path}` : null,
          year: (m.release_date || m.first_air_date || '').split('-')[0],
          rating: m.vote_average ? m.vote_average.toFixed(1) : null,
          type: m.media_type === 'tv' || m.name ? 'TV Show' : 'Movie',
          isTMDB: true
        })) || [];

        // Format romance — no keyword filtering, keep all adult/18+ content
        const formatRomance = (results) => (results || []).slice(0, 18).map(m => ({
          id: m.id,
          title: m.title || m.name,
          poster: m.poster_path ? `${IMG_BASE}${m.poster_path}` : null,
          year: (m.release_date || m.first_air_date || '').split('-')[0],
          rating: m.vote_average ? m.vote_average.toFixed(1) : null,
          type: m.media_type === 'tv' || m.name ? 'TV Show' : 'Movie',
          isTMDB: true
        }));

        const trendingData = await trendingRes.json();
        const kdramaData = await kdramaRes.json();
        const bollywoodData = await bollywoodRes.json();
        const hollywoodData = await hollywoodRes.json();
        const animatedData = await animatedRes.json();
        const animeData = await animeRes.json();
        const actionData = await actionRes.json();
        const scifiData = await scifiRes.json();
        const punjabiData = await punjabiRes.json();
        const romanceData = romanceRes ? await romanceRes.json() : null;

        // Format Hero — when romance/adult is enabled for tayyab4855, mix in some romance hero slides
        let heroItems = trendingData.results?.filter(m => {
          if (adultEnabled) return true;
          if (m.adult === true) return false;
          if (containsAdultWord(m.title) || containsAdultWord(m.name) || containsAdultWord(m.overview)) return false;
          return true;
        }) || [];

        // If tayyab4855 with adult enabled, append romance picks into the hero carousel
        if (isTayyabUser && adultEnabled && romanceData?.results?.length > 0) {
          const romanceHeroItems = romanceData.results.slice(0, 3);
          heroItems = [...romanceHeroItems, ...heroItems].slice(0, 8);
        }

        setHeroSlides(heroItems.slice(0, 8).map(m => ({
          id: m.id,
          title: m.title || m.name,
          image: m.backdrop_path ? `${HERO_IMG_BASE}${m.backdrop_path}` : `${HERO_IMG_BASE}${m.poster_path}`,
          rating: m.vote_average ? m.vote_average.toFixed(1) : null,
          year: (m.release_date || m.first_air_date || '').split('-')[0],
          duration: m.media_type === 'tv' ? 'TV Series' : 'Movie',
          mediaType: m.media_type === 'tv' ? 'tv' : 'movie',
          genres: ['Trending', m.media_type === 'tv' ? 'TV' : 'Movie'],
          description: m.overview,
          isTMDB: true
        })));

        setKdrama(formatTMDB(kdramaData.results, false));
        setBollywood(formatTMDB(bollywoodData.results, false));
        setHollywood(formatTMDB(hollywoodData.results, true));
        setAnimatedFilm(formatTMDB(animatedData.results, true));
        setAnime(formatTMDB(animeData.results, true));
        setAction(formatTMDB(actionData.results, true));
        setScifi(formatTMDB(scifiData.results, true));
        setPunjabi(formatTMDB(punjabiData.results, false));

        // Romance: only set for tayyab4855 with adult enabled
        if (isTayyabUser && adultEnabled && romanceData?.results) {
          setRomance(formatRomance(romanceData.results));
        } else {
          setRomance([]);
        }



      } catch (err) {
        console.error("Failed to fetch TMDB home data:", err);
      }
    };

    fetchHomeData();
  }, [isTayyab, unrestrictedRomance]);

  const toggleRomanceUnrestricted = () => {
    const newVal = !unrestrictedRomance;
    setUnrestrictedRomance(newVal);
    localStorage.setItem('cinestream_romance_unrestricted', newVal);
  };

  return (
    <div className="home">
      <Navbar />

      {/* ── Hero Carousel ──────────────────────────────────────── */}
      {heroSlides.length > 0 && <HeroCarousel slides={heroSlides} />}

      {/* ── OTT Platforms ──────────────────────────────────────── */}
      <OTTPlatformStrip />

      {/* ── Content rows ──────────────────────────────── */}
      <div className="home__content">
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '20px 4% 0' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', borderRadius: '100px',
              background: 'linear-gradient(135deg, rgba(229,9,20,0.15) 0%, rgba(255,107,53,0.15) 100%)',
              border: '1px solid rgba(229,9,20,0.4)',
              color: '#ff6b6b', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', backdropFilter: 'blur(8px)',
              transition: 'all 0.3s ease', letterSpacing: '0.5px'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(229,9,20,0.35) 0%, rgba(255,107,53,0.25) 100%)';
              e.currentTarget.style.transform = 'scale(1.04)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(229,9,20,0.3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(229,9,20,0.15) 0%, rgba(255,107,53,0.15) 100%)';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <RefreshCw size={14} style={{ animation: 'none' }} /> Refresh Content
          </button>
        </div>
        
        <div className="home__section-spacer" />

        {kdrama.length > 0 && (
          <ContentSection
            id="kdrama"
            title="K-Drama"
            items={kdrama}
            cardProps={{ showRating: true, showYear: true }}
          />
        )}

        {bollywood.length > 0 && (
          <ContentSection
            id="bollywood"
            title="Bollywood"
            items={bollywood}
            cardProps={{ showRating: true, showYear: true }}
          />
        )}

        {action.length > 0 && (
          <ContentSection
            id="action"
            title="Action & Adventure"
            items={action}
            cardProps={{ showRating: true, showYear: true }}
          />
        )}

        {hollywood.length > 0 && (
          <ContentSection
            id="hollywood"
            title="Hollywood"
            items={hollywood}
            cardProps={{ showRating: true, showYear: true }}
          />
        )}

        {scifi.length > 0 && (
          <ContentSection
            id="scifi"
            title="Sci-Fi & Fantasy"
            items={scifi}
            cardProps={{ showRating: true, showYear: true }}
          />
        )}

        {animatedFilm.length > 0 && (
          <ContentSection
            id="anime-picks"
            title="Animated Film"
            items={animatedFilm}
            cardProps={{ showRating: true, showYear: true }}
          />
        )}

        {punjabi.length > 0 && (
          <ContentSection
            id="punjabi"
            title="Punjabi Movies"
            items={punjabi}
            cardProps={{ showRating: true, showYear: true }}
          />
        )}

        {anime.length > 0 && (
          <ContentSection
            id="anime"
            title="Anime"
            items={anime}
            cardProps={{ showRating: true, showYear: true }}
          />
        )}

        {/* ── Romance — only for tayyab4855 with adult content enabled ── */}
        {isTayyab && romance.length > 0 && (
          <ContentSection
            id="romance"
            title="💋 Romance & 18+ Picks"
            items={romance}
            cardProps={{ showRating: true, showYear: true }}
          />
        )}

      </div>
      <Footer />
    </div>
  );
}
