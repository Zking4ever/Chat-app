import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Platform,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  useAnimatedScrollHandler,
  withRepeat,
  withTiming,
  withDelay,
  interpolateColor
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  { id: '1', key: 'slide1', bg: '#FFC1CC', icon: '❤️', image: require('../assets/images/image1.jpg'), offset: { left: -50, top: 0 } },
  { id: '2', key: 'slide2', bg: '#d78dff90', icon: '🌹', image: require('../assets/images/image2.jpg'), offset: { left: -50, top: 0 } },
  { id: '3', key: 'slide3', bg: '#d2a9b6', icon: '😘', image: require('../assets/images/image3.jpg'), offset: { left: -50, top: 0 } },
  { id: '4', key: 'slide4', bg: '#9C27B0', icon: '✨', image: require('../assets/images/image4.jpg'), offset: { left: -30, top: -10 } },
  { id: '5', key: 'slide5', bg: '#673AB7', icon: '💝', image: require('../assets/images/bg5.jpg'), offset: { left: -10, top: 0 } },
];

const BackgroundLayer = ({ scrollX }: { scrollX: Animated.SharedValue<number> }) => {
  return (
    <View style={StyleSheet.absoluteFill}>
      {SLIDES.map((slide, index) => {
        const animatedStyle = useAnimatedStyle(() => {
          const opacity = interpolate(
            scrollX.value,
            [(index - 0.7) * width, index * width, (index + 0.7) * width],
            [0, 1, 0],
            Extrapolate.CLAMP
          );

          return {
            opacity: opacity * 0.9,
            left: `${slide.offset.left}%`,
            top: `${slide.offset.top}%`,
            width: '200%',
            height: '110%',
            position: 'absolute'
          };
        });

        return (
          <Animated.Image
            key={slide.id}
            source={slide.image}
            style={animatedStyle}
            resizeMode="cover"
          />
        );
      })}
    </View>
  );
};

const FloatingHeart = ({ delay = 0 }) => {
  const tx = useSharedValue(Math.random() * width);
  const ty = useSharedValue(height + 100);
  const scale = useSharedValue(Math.random() * 0.5 + 0.5);
  const opacity = useSharedValue(0.8);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: tx.value,
    top: ty.value,
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    ty.value = withRepeat(
      withDelay(delay, withTiming(-100, { duration: 6000 + Math.random() * 2000 })),
      -1,
      false
    );
    tx.value = withRepeat(
      withTiming(tx.value + (Math.random() * 100 - 50), { duration: 2000 }),
      -1,
      true
    );
  }, []);

  return (
    <Animated.View style={style}>
      <Text style={{ fontSize: 24 }}>❤️</Text>
    </Animated.View>
  );
};

const SlideItem = ({ item, index, scrollX }: any) => {
  const { t } = useTranslation();

  const iconStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [0.3, 1.2, 0.3],
      Extrapolate.CLAMP
    );
    const opacity = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [0, 1, 0],
      Extrapolate.CLAMP
    );
    const rotate = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [-30, 0, 30],
      Extrapolate.CLAMP
    );
    return {
      opacity,
      transform: [
        { scale },
        { rotate: `${rotate}deg` }
      ]
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [0, 1, 0],
      Extrapolate.CLAMP
    );
    const translateY = interpolate(
      scrollX.value,
      [(index - 1) * width, index * width, (index + 1) * width],
      [100, 0, -100],
      Extrapolate.CLAMP
    );
    return { opacity, transform: [{ translateY }] };
  });

  return (
    <View style={styles.slide}>
      <Animated.View style={[iconStyle]}>
        <Text>{item.icon}</Text>
      </Animated.View>
      <Animated.View style={[styles.textContainer, textStyle]}>
        <Text style={styles.romanticText}>
          {t(`welcome.slides.${item.key}`)}
        </Text>
      </Animated.View>
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
  const { t, i18n } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollX = useSharedValue(0);
  const flatListRef = useRef<FlatList>(null);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const containerAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      scrollX.value,
      SLIDES.map((_, i) => i * width),
      SLIDES.map((s) => s.bg)
    );
    return { backgroundColor };
  });

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const handleGetStarted = async () => {
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

      <BackgroundLayer scrollX={scrollX} />

      {[...Array(15)].map((_, i) => (
        <FloatingHeart key={i} delay={i * 400} />
      ))}

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
          <Text style={styles.buttonText}>
            {currentIndex === SLIDES.length - 1 ? t('welcome.getStarted') : t('welcome.next')}
          </Text>
        </TouchableOpacity>

        <View style={styles.langContainer}>
          <TouchableOpacity onPress={() => i18n.changeLanguage('en')}>
            <Text style={[styles.langText, i18n.language === 'en' && styles.activeLang]}>EN</Text>
          </TouchableOpacity>
          <Text style={styles.langSeparator}>|</Text>
          <TouchableOpacity onPress={() => i18n.changeLanguage('am')}>
            <Text style={[styles.langText, i18n.language === 'am' && styles.activeLang]}>አማ</Text>
          </TouchableOpacity>
        </View>
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
    padding: 30,
  },
  slideImage: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: 20,
    marginBottom: 40,
    borderWidth: 5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
  },
  romanticText: {
    fontSize: 32,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 45,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 10,
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
    width: width * 0.8,
    height: 64,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#E91E63',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E91E63',
  },
  langContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  langText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.6,
  },
  activeLang: {
    opacity: 1,
    textDecorationLine: 'underline',
  },
  langSeparator: {
    color: '#fff',
    marginHorizontal: 10,
    opacity: 0.5,
  }
});