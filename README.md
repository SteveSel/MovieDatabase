# Movie Database Application

## Overview
A single-screen React Native mobile application built to demonstrate core mobile development concepts, including RESTful API integration, dynamic asynchronous state management, and responsive native UI design. The application interfaces with The Movie Database (TMDB) API to display popular movies, execute targeted title searches, apply advanced data filters, and render official YouTube trailers dynamically based on device dimensions.

## Core Features
* **Dynamic Data Fetching:** Fetches and displays popular movies upon initialization using React hooks (`useEffect`, `useState`).
* **Complex Search Routing:** Seamlessly routes user queries between TMDB's `Search` endpoint (for text-based titles) and the `Discover` endpoint (for date and rating parameters).
* **Data Validation:** Implements strict Regex (`/^\d{2}-\d{2}-\d{4}$/`) and mathematical calendar validation to sanitize user-inputted dates before executing API queries.
* **Responsive Multimedia Integration:** Utilizes React Native's `Dimensions` API to calculate the device's physical screen width, dynamically scaling a 16:9 YouTube iframe for trailer playback to prevent UI clipping across different devices.
* **Robust UI/UX:** Utilizes React Native `Modal`, `ScrollView`, and `KeyboardAvoidingView` to handle mobile-specific interface challenges, such as preventing the software keyboard from overlapping input fields during filtering.

## Tech Stack
* **Framework:** React Native (Expo)
* **Language:** JavaScript
* **Third-Party Packages:** `react-native-youtube-iframe`, `@expo/vector-icons`
* **Version Control:** Git / GitHub

---

## Architecture & API Integration

This application relies on a centralized data-fetching architecture to handle three distinct states of user intent: default browsing, title searching, and advanced filtering. Because the TMDB API strictly separates text-based searches from parameter-based discovery, the application evaluates local state variables prior to constructing the HTTP request.

### 1. The Primary Fetch Logic (`fetchMovies`)
The application determines which REST endpoint to hit based on the presence of user input. It also includes a `vote_count.gte=300` threshold during discovery to filter out unrated or obscure data anomalies.

```javascript
const fetchMovies = () => {
  setIsLoading(true);
  let URL = '';

  // 1. Title Search (Triggered if the text search bar is active)
  if (searchQuery.trim() !== '') {
    URL = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}`;
  } 
  // 2. Advanced Filters (Triggered if search is empty, but filters are applied)
  else if (filterDate !== '' || filterRating !== '') {
    URL = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&sort_by=popularity.desc&vote_count.gte=300`;
    
    // Formats DD-MM-YYYY to the API-required YYYY-MM-DD
    if (filterDate !== '') {
      const [day, month, year] = filterDate.split('-');
      URL += `&primary_release_date.gte=${year}-${month}-${day}`;
    }
    if (filterRating !== '') {
      URL += `&vote_average.gte=${filterRating}`;
    }
  } 
  // 3. Default State (Loads general popular movies)
  else {
    URL = `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`;
  }

  // Execute the HTTP Request
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
```

### 2. Trailer Fetching (`fetchTrailer`)
When a user selects a movie and requests the trailer, a secondary asynchronous request is made to the `/videos` endpoint using the specific Movie ID. The response array is then parsed to locate the official YouTube video key.

```javascript
const fetchTrailer = async (movieId) => {
  setIsVideoLoading(true);
  try {
    const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${API_KEY}`);
    const data = await response.json();
    
    // Iterates through returned videos to isolate the official YouTube trailer
    const trailer = data.results.find(vid => vid.site === 'YouTube' && vid.type === 'Trailer');
    
    if (trailer) {
      setTrailerKey(trailer.key); // Triggers the iframe render
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
```

---

## Security Context
The TMDB API key is strictly excluded from source control. The application utilizes Expo's environment variable implementation. To run this project locally, a `.env` file must be securely created at the project root containing a valid TMDB v3 Auth Key prefixed with `EXPO_PUBLIC_`.

## Local Installation & Setup

1. Clone the repository:
```bash
git clone [https://github.com/SteveSel/MovieDatabase.git](https://github.com/SteveSel/MovieDatabase.git)
```
2. Navigate to the project directory:
```bash
cd MovieDatabase
```
3. Install project dependencies:
```bash
npm install
```
4. Create a `.env` file in the root directory and define your TMDB API key:
```text
EXPO_PUBLIC_TMDB_API_KEY=your_api_key
```
5. Start the Expo development server (clearing the cache is recommended to ensure the `.env` file is read):
```bash
npx expo start -c
```