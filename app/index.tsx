import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  Dimensions,
  FlatList, Image,
  KeyboardAvoidingView,
  Modal,
  Platform, ScrollView,
  StyleSheet, Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

export default function Index() {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(''); 
  
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [filterRating, setFilterRating] = useState('');

  const [selectedMovie, setSelectedMovie] = useState(null);
  const [trailerKey, setTrailerKey] = useState(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  const videoWidth = Dimensions.get('window').width - 40; 
  const videoHeight = videoWidth * (9 / 16);

  const API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY; 

  const fetchMovies = () => {
    setIsLoading(true);
    let URL = '';

    if (searchQuery.trim() !== '') {
      URL = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}`;
    } else if (filterDate !== '' || filterRating !== '') {
      URL = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc&vote_count.gte=300`;
      if (filterDate !== '') {
        const [day, month, year] = filterDate.split('-');
        URL += `&primary_release_date.gte=${year}-${month}-${day}`;
      }
      if (filterRating !== '') {
        URL += `&vote_average.gte=${filterRating}`;
      }
    } else {
      URL = `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`;
    }

    fetch(URL)
      .then((response) => response.json())
      .then((data) => {
        setMovies(data.results || []);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setIsLoading(false);
      });
  };

  useEffect(() => { 
    fetchMovies(); 
  }, []);

  const handleTextSearch = () => {
    setFilterDate(''); 
    setFilterRating(''); 
    fetchMovies();
  };

  const applyFilters = () => {
    if (filterDate.trim() !== '') {
      const regex = /^\d{2}-\d{2}-\d{4}$/;
      if (!regex.test(filterDate)) {
        Alert.alert("Invalid Format", "Please use DD-MM-YYYY"); 
        return; 
      }
      const [day, month, year] = filterDate.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      if (dateObj.getFullYear() !== year || dateObj.getMonth() !== month - 1 || dateObj.getDate() !== day) {
        Alert.alert("Invalid Date", "Date does not exist on the calendar."); 
        return; 
      }
    }
    setSearchQuery(''); 
    setIsFilterVisible(false); 
    fetchMovies();
  };

  const resetFilters = () => {
    setSearchQuery(''); 
    setFilterDate(''); 
    setFilterRating('');
    setIsFilterVisible(false); 
    setTimeout(fetchMovies, 100); 
  };

  const fetchTrailer = async (movieId) => {
    setIsVideoLoading(true);
    try {
      const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${API_KEY}`);
      const data = await response.json();
      const trailer = data.results.find(vid => vid.site === 'YouTube' && vid.type === 'Trailer');
      
      if (trailer) {
        setTrailerKey(trailer.key); 
      } else {
        Alert.alert("No Trailer Found", "Sorry, we couldn't find an official trailer for this movie.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load the trailer.");
    } finally {
      setIsVideoLoading(false);
    }
  };

  const closeDetailsModal = () => {
    setSelectedMovie(null);
    setTrailerKey(null);
  };

  const renderMovieItem = ({ item }) => {
    const imageUrl = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster';
    const releaseYear = item.release_date ? item.release_date.split('-')[0] : 'N/A';

    return (
      <TouchableOpacity style={styles.movieCard} onPress={() => setSelectedMovie(item)}>
        <Image source={{ uri: imageUrl }} style={styles.poster} />
        <View style={styles.movieInfo}>
          <Text style={styles.movieTitle} numberOfLines={2}>{item.title} ({releaseYear})</Text>
          <Text style={styles.movieRating}>⭐ {item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}/10</Text>
          <Text style={styles.movieOverview} numberOfLines={3}>{item.overview}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* MAIN SCREEN HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Movie Database</Text>
        <View style={styles.searchRow}>
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search by title..." 
            value={searchQuery} 
            onChangeText={setSearchQuery} 
            onSubmitEditing={handleTextSearch} 
            returnKeyType="search" 
          />
          <TouchableOpacity onPress={() => setIsFilterVisible(true)} style={styles.filterButton}>
            <Ionicons name="options-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* MODAL 1: ADVANCED FILTERS */}
      <Modal visible={isFilterVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Advanced Filters</Text>
            
            <Text style={styles.label}>Released On or After (DD-MM-YYYY)</Text>
            <TextInput style={styles.modalInput} keyboardType="numbers-and-punctuation" maxLength={10} value={filterDate} onChangeText={setFilterDate} placeholder="e.g., 25-12-2020" />
            
            <Text style={styles.label}>Minimum Star Rating (0-10)</Text>
            <TextInput style={styles.modalInput} keyboardType="numeric" maxLength={2} value={filterRating} onChangeText={setFilterRating} placeholder="e.g., 8" />
            
            <View style={styles.modalButtons}>
              <Button title="Reset" color="red" onPress={resetFilters} />
              <Button title="Apply Filters" onPress={applyFilters} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL 2: MOVIE DETAILS & TRAILER */}
      <Modal visible={selectedMovie !== null} animationType="slide">
        {selectedMovie && (
          <ScrollView contentContainerStyle={styles.detailsContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={closeDetailsModal}>
              <Ionicons name="close-circle" size={40} color="#333" />
            </TouchableOpacity>

            <Image source={{ uri: selectedMovie.poster_path ? `https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}` : 'https://via.placeholder.com/500x750?text=No+Poster' }} style={styles.detailsPoster} />
            <Text style={styles.detailsTitle}>{selectedMovie.title}</Text>
            
            <View style={styles.detailsMeta}>
              <Text style={styles.detailsRating}>⭐ {selectedMovie.vote_average.toFixed(1)}/10</Text>
              <Text style={styles.detailsDate}>Release: {selectedMovie.release_date}</Text>
            </View>

            <Text style={styles.detailsOverviewText}>{selectedMovie.overview}</Text>

            {trailerKey ? (
              <View style={styles.videoContainer}>
                <YoutubePlayer
                  height={videoHeight}
                  width={videoWidth}
                  play={true}
                  videoId={trailerKey}
                />
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.trailerButton} 
                onPress={() => fetchTrailer(selectedMovie.id)}
                disabled={isVideoLoading}
              >
                {isVideoLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="play" size={24} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.trailerButtonText}>Watch Trailer</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            
            <View style={{ height: 40 }} /> 
          </ScrollView>
        )}
      </Modal>
      
      {/* MAIN SCREEN MOVIE LIST */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 50 }} />
      ) : (
        <FlatList 
          data={movies} 
          keyExtractor={(item) => item.id.toString()} 
          renderItem={renderMovieItem} 
          contentContainerStyle={styles.listContainer} 
          ListEmptyComponent={<Text style={styles.emptyText}>No movies found.</Text>} 
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  header: { paddingTop: 60, paddingBottom: 15, backgroundColor: '#fff', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  searchRow: { flexDirection: 'row', width: '90%', alignItems: 'center', backgroundColor: '#eee', borderRadius: 8, paddingHorizontal: 10 },
  searchInput: { flex: 1, height: 40, fontSize: 16 },
  filterButton: { padding: 5 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', padding: 25, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 5, color: '#333' },
  modalInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 20, fontSize: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  
  listContainer: { padding: 15 },
  movieCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, marginBottom: 15, overflow: 'hidden', elevation: 3 },
  poster: { width: 100, height: 150, backgroundColor: '#ccc' },
  movieInfo: { flex: 1, padding: 10, justifyContent: 'center' },
  movieTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  movieRating: { fontSize: 14, color: '#555', marginBottom: 5 },
  movieOverview: { fontSize: 12, color: '#777' },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#555' },
  
  detailsContainer: { padding: 20, paddingTop: 60, alignItems: 'center', backgroundColor: '#fff', minHeight: '100%' },
  closeButton: { position: 'absolute', top: 40, right: 20, zIndex: 10 },
  detailsPoster: { width: 200, height: 300, borderRadius: 15, marginBottom: 20 },
  detailsTitle: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  detailsMeta: { flexDirection: 'row', justifyContent: 'space-between', width: '80%', marginBottom: 20 },
  detailsRating: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  detailsDate: { fontSize: 16, color: '#666' },
  detailsOverviewText: { fontSize: 16, lineHeight: 24, color: '#444', textAlign: 'justify', marginBottom: 30 },
  
  trailerButton: { flexDirection: 'row', backgroundColor: '#e50914', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30, alignItems: 'center', justifyContent: 'center', width: '80%', marginBottom: 40 },
  trailerButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  videoContainer: { width: '100%', borderRadius: 15, overflow: 'hidden', marginBottom: 40 }
});