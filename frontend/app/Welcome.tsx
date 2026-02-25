import { useRouter } from 'expo-router';
import React, { useState, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  interpolateColor,
  useAnimatedScrollHandler,
  FadeInDown,
  FadeInUp
} from 'react-native-reanimated';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');


const SLIDES = [
  {
    id: '1',
    title: 'Fast Messaging',
    description: 'Experience lightning-fast delivery for all your messages anywhere, anytime.',
    backgroundColor: '#075E54',
    icon: '🚀'
  },
  {
    id: '2',
    title: 'Secure & Private',
    description: 'Your conversations are protected with end-to-end encryption for maximum privacy.',
    backgroundColor: '#128C7E',
    icon: '🔒'
  },
  {
    id: '3',
    title: 'Voice & Video',
    description: 'High-quality calls to stay connected with friends and family across the globe.',
    backgroundColor: '#25D366',
    icon: '📞'
  },
  {
    id: '4',
    title: 'Start Chatting',
    description: 'Join ABA today and start a new era of communication.',
    backgroundColor: '#34B7F1',
    icon: '✨'
  }
];

const SlideItem = ({ item, index, scrollX }: any) => {
  const iconAnimatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [width * 0.4, 0, -width * 0.4],
      Extrapolate.CLAMP
    );
    const scale = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [0.6, 1, 0.6],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ translateX }, { scale }],
    };
  });

  return (
    <View style={styles.slide}>
      <Animated.View style={[styles.iconContainer, iconAnimatedStyle]}>
        <Text style={styles.iconText}>{item.icon}</Text>
      </Animated.View>
      <View style={styles.textContainer}>
        <Animated.Text
          entering={FadeInDown.delay(200).duration(800)}
          style={styles.title}
        >
          {item.title}
        </Animated.Text>
        <Animated.Text
          entering={FadeInUp.delay(400).duration(800)}
          style={styles.description}
        >
          {item.description}
        </Animated.Text>
      </View>
    </View>
  );
};

const PaginationDot = ({ index, scrollX }: any) => {
  const animatedStyle = useAnimatedStyle(() => {
    const dotWidth = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [8, 24, 8],
      Extrapolate.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [0.3, 1, 0.3],
      Extrapolate.CLAMP
    );
    return {
      width: dotWidth,
      opacity,
    };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
};

export default function Welcome() {
  const router = useRouter();
  const { completeOnboarding } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollX = useSharedValue(0);
  const flatListRef = useRef<FlatList>(null);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const backgroundColors = useMemo(() => SLIDES.map(s => s.backgroundColor), []);
  const scrollRange = useMemo(() => SLIDES.map((_, i) => i * width), []);

  const containerAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      scrollX.value,
      scrollRange,
      backgroundColors
    );
    return { backgroundColor };
  });

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const handleGetStarted = async () => {
    await completeOnboarding();
    router.replace('/Login');
  };


  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true
      });
    } else {
      handleGetStarted();
    }
  };

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <StatusBar barStyle="light-content" />
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={({ item, index }) => (
          <SlideItem item={item} index={index} scrollX={scrollX} />
        )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        keyExtractor={(item) => item.id}
      />

      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <PaginationDot key={index} index={index} scrollX={scrollX} />
          ))}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Animated.Text style={styles.buttonText}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Animated.Text>
        </TouchableOpacity>

        {currentIndex < SLIDES.length - 1 && (
          <TouchableOpacity onPress={handleGetStarted} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    width,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  iconContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  iconText: {
    fontSize: 80,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 40,
    height: 8,
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginHorizontal: 5,
  },
  button: {
    width: width * 0.85,
    height: 64,
    backgroundColor: '#fff',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    // Modern shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#075E54',
  },
  skipBtn: {
    padding: 15,
  },
  skipText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.8,
  }
});


