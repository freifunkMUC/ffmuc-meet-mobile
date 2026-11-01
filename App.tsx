import React from 'react';
import { Image, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from './src/theme';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Image source={require('./assets/logo.png')} style={styles.logo} />
          <Text style={styles.title}>Freifunk Meet</Text>
          <Text style={styles.subtitle}>meet.ffmuc.net</Text>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 128, height: 128, marginBottom: spacing.l },
  title: { color: colors.text, fontSize: 28, fontWeight: '700' },
  subtitle: { color: colors.sun, fontSize: 16, marginTop: spacing.s },
});

export default App;
