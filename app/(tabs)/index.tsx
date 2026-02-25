import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Index() {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // PASTE YOUR API KEY HERE AGAIN
  const API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY;
  const URL = `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`;

  useEffect(() => {
    fetch(URL)
      .then((response) => response.json())
      .then((data) => {
        setMovies(data.results);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setIsLoading(false);
      });
  }, []);

  // This function designs how ONE single movie looks in the list
  const renderMovieItem = ({ item }) => {
    // TMDB requires this base URL to actually show the image
    const imageUrl = `https://image.tmdb.org/t/p/w500${item.poster_path}`;

    return (
      // TouchableOpacity makes the card act like a button that fades slightly when tapped
      <TouchableOpacity style={styles.movieCard} onPress={() => console.log("Tapped:", item.title)}>
        <Image source={{ uri: imageUrl }} style={styles.poster} />
        <View style={styles.movieInfo}>
          <Text style={styles.movieTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.movieRating}>⭐ {item.vote_average.toFixed(1)}/10</Text>
          <Text style={styles.movieOverview} numberOfLines={3}>{item.overview}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Popular Movies</Text>
      </View>
      
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 50 }} />
      ) : (
        <FlatList 
          data={movies}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMovieItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

// The design rules for our app
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 15,
  },
  movieCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 3, // Adds a shadow on Android
    shadowColor: '#000', // Adds a shadow on iOS
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  poster: {
    width: 100,
    height: 150,
  },
  movieInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  movieTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  movieRating: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  movieOverview: {
    fontSize: 12,
    color: '#777',
  }
});