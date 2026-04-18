import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';
import { CartProvider } from '@/providers/CartProvider';
import { PurchaseProvider } from '@/providers/PurchaseProvider';
import { initializeAds } from '@/utils/ads';

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="welcome" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="scan" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="add-manual" options={{ presentation: 'modal', title: 'Add Item', headerStyle: { backgroundColor: '#F8F5FF' }, headerTintColor: '#3B1F78' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize ads (only on native platforms)
        if (Platform.OS !== 'web') {
          await initializeAds();
        }
      } catch (error) {
        console.log('Error during initialization:', error);
      } finally {
        setIsReady(true);
        void SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <CartProvider>
          <PurchaseProvider>
            <RootLayoutNav />
          </PurchaseProvider>
        </CartProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
