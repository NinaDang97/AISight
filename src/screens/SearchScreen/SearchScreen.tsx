import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  BackHandler,
  Keyboard,
  Image,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaWrapper } from '../../components/common/SafeAreaWrapper';
import { BackButton } from '../../components/common/BackButton';
import { FilterChip } from '../../components/common/FilterChip';
import { colors, typography, spacing } from '../../styles';
import { MapStackParamList, Routes } from '../../navigation/routes';

type SearchScreenNavigationProp = StackNavigationProp<MapStackParamList, typeof Routes.Map.SEARCH>;

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<SearchScreenNavigationProp>();
  const searchInputRef = useRef<TextInput>(null);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Keyboard focus with delay after screen transition
  useFocusEffect(
    useCallback(() => {
      // React Navigation default transition is 250ms on iOS, 350ms on Android
      const transitionDuration = Platform.OS === 'ios' ? 250 : 350;

      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, transitionDuration + 50); // +50ms buffer for safety

      return () => {
        clearTimeout(timer);
      };
    }, [])
  );

  // Handle back press with keyboard dismiss
  const handleBackPress = useCallback(() => {
    let hasNavigated = false;

    // Dismiss keyboard first
    Keyboard.dismiss();

    // Wait for keyboard dismiss animation to complete
    const listener = Keyboard.addListener('keyboardDidHide', () => {
      listener.remove();
      if (!hasNavigated) {
        hasNavigated = true;
        navigation.goBack();
      }
    });

    // Fallback timeout in case event doesn't fire (keyboard already hidden)
    setTimeout(() => {
      listener.remove();
      if (!hasNavigated) {
        hasNavigated = true;
        navigation.goBack();
      }
    }, 300);
  }, [navigation]);

  // Android hardware back button handling
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          handleBackPress();
          return true; // Prevent default back action
        }
      );

      return () => backHandler.remove();
    }
  }, [handleBackPress]);

  // TODO: Implement search functionality
  // Add these handler functions for search and filter:
  //
  // 1. handleSearchChange(text: string) - Called when user types in search input
  //    - Update searchQuery state: setSearchQuery(text)
  //    - Debounce API calls (use setTimeout with 400ms delay)
  //    - Search based on activeFilter: 'All' searches everything, 'Vessels' only vessels, etc.
  //    - Update searchResults state with filtered results
  //
  // 2. handleFilterChange(filter: string) - Called when user taps a filter chip
  //    - Update activeFilter state: setActiveFilter(filter)
  //    - Re-run search if searchQuery is not empty
  //    - Filter types: 'All', 'Vessels', 'Ports', 'Places'
  //
  // 3. handleResultSelect(result: any) - Called when user taps a search result
  //    - Navigate back to Map screen with selected item
  //    - Pass coordinates to zoom map to selected location
  //
  // Example: const handleSearchChange = (text) => { setSearchQuery(text); /* Add debounce & API logic */ };

  return (
    <SafeAreaWrapper edges={['top', 'left', 'right']} backgroundColor="#2C2C2E">
      <View style={styles.container}>
        {/* Custom Header */}
        <View style={styles.header}>
          <BackButton onPress={handleBackPress} iconColor="#FFFFFF" />
          <Text style={styles.headerTitle}>Search</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Image
            source={require('../../../assets/images/icons/search-icon.png')}
            style={styles.searchIcon}
          />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor={colors.textSecondary}
            returnKeyType="search"
            autoFocus={false}
            autoCorrect={false}
            autoCapitalize="none"
            onChangeText={setSearchQuery}
            value={searchQuery}
            // TODO: Add search functionality - connect to handleSearchChange function with debouncing
          />
        </View>

        {/* Filter Chips
            TODO: Connect to handleFilterChange function to filter search results
            When a chip is pressed, it should:
            1. Update activeFilter state
            2. Re-run search with the new filter
            Example: onPress={() => handleFilterChange('All')}
        */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsContent}
          style={styles.filterChipsContainer}
        >
          <FilterChip
            label="All"
            active={activeFilter === 'All'}
            onPress={() => setActiveFilter('All')} // TODO: Change to handleFilterChange('All')
          />
          <FilterChip
            label="Vessels"
            icon={require('../../../assets/images/icons/vessel-icon.png')}
            active={activeFilter === 'Vessels'}
            onPress={() => setActiveFilter('Vessels')} // TODO: Change to handleFilterChange('Vessels')
          />
          <FilterChip
            label="Ports"
            icon={require('../../../assets/images/icons/port-icon.png')}
            active={activeFilter === 'Ports'}
            onPress={() => setActiveFilter('Ports')} // TODO: Change to handleFilterChange('Ports')
          />
          <FilterChip
            label="Places"
            icon={require('../../../assets/images/icons/location-icon.png')}
            active={activeFilter === 'Places'}
            onPress={() => setActiveFilter('Places')} // TODO: Change to handleFilterChange('Places')
          />
        </ScrollView>

        {/* Results Area - Placeholder
            TODO: Replace with FlatList showing search results
            When implementing:
            1. Add state: const [searchResults, setSearchResults] = useState([]);
            2. Add state: const [isLoading, setIsLoading] = useState(false);
            3. Show loading indicator while searching
            4. Display results in FlatList with onPress calling handleResultSelect(result)
            5. Each result should show: icon, name, subtitle, and chevron
            Example result: { id: '123', type: 'vessel', name: 'MV Ocean', coordinates: [lon, lat] }
        */}
        <View style={styles.resultsContainer}>
          {searchQuery.trim() === '' ? (
            <Text style={styles.placeholderText}>
              Start typing to search for vessels, Ports , or Places
            </Text>
          ) : (
            <Text style={styles.placeholderText}>
              Searching for "{searchQuery}"...
            </Text>
          )}
        </View>
      </View>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C2C2E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.medium,
    paddingVertical: spacing.small,
    height: 56,
  },
  headerTitle: {
    ...typography.heading4,
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 44, // Same as BackButton width for centering
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(243, 240, 240, 0.9)', // #F3F0F0 with 90% opacity
    borderRadius: 12,
    marginHorizontal: spacing.medium,
    marginTop: spacing.small,
    marginBottom: spacing.medium,
    paddingHorizontal: spacing.medium,
    height: 48,
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: spacing.small,
    tintColor: colors.textSecondary,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: '#000000',
    padding: 0, // Remove default padding
  },
  filterChipsContainer: {
    marginBottom: spacing.medium,
    flexGrow: 0,// Prevent ScrollView from expanding
  },
  filterChipsContent: {
    flexDirection: 'row',
    gap: spacing.small,
    paddingHorizontal: spacing.medium,
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.large,
  },
  placeholderText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
