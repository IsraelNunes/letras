import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LearnerRootStackParamList } from '../../types';
import { learnerTheme } from './learnerTheme';

type Props = NativeStackScreenProps<LearnerRootStackParamList, 'LearnerStageConclusion'>;

function SealBadge({ stageNumber }: { stageNumber: number }) {
  const scaleAnim = useRef(new Animated.Value(0.4)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 7,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacityAnim, scaleAnim]);

  return (
    <Animated.View
      style={[
        styles.sealWrap,
        { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
      ]}
    >
      <View style={styles.sealOuter}>
        <View style={styles.sealMiddle}>
          <View style={styles.sealInner}>
            <Text style={styles.sealStar}>★</Text>
            <Text style={styles.sealNumber}>{stageNumber}</Text>
            <Text style={styles.sealLabel}>ETAPA</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

function ConfettiDot({ x, y, color, delay }: { x: number; y: number; color: string; delay: number }) {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -20, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
      Animated.timing(opacityAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [delay, opacityAnim, translateY]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: color,
        opacity: opacityAnim,
        transform: [{ translateY }],
      }}
    />
  );
}

const CONFETTI = [
  { x: 30, y: 10, color: '#f59e0b', delay: 100 },
  { x: 80, y: 0, color: '#10b981', delay: 200 },
  { x: 140, y: 15, color: '#3b82f6', delay: 150 },
  { x: 200, y: 5, color: '#ef4444', delay: 300 },
  { x: 260, y: 20, color: '#8b5cf6', delay: 50 },
  { x: 310, y: 0, color: '#f59e0b', delay: 250 },
  { x: 55, y: 30, color: '#10b981', delay: 350 },
  { x: 175, y: 35, color: '#f97316', delay: 180 },
  { x: 240, y: 25, color: '#06b6d4', delay: 420 },
];

export function LearnerStageConclusionView({ navigation, route }: Props) {
  const { stageNumber, stageTitle, pointsEarned } = route.params;

  const slideY = useRef(new Animated.Value(30)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [opacity, slideY]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Confetti overlay */}
      <View style={styles.confettiContainer} pointerEvents="none">
        {CONFETTI.map((c, i) => (
          <ConfettiDot key={i} x={c.x} y={c.y} color={c.color} delay={c.delay} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View
          style={[styles.wrapper, { opacity, transform: [{ translateY: slideY }] }]}
        >
          {/* Badge */}
          <SealBadge stageNumber={stageNumber} />

          {/* Title */}
          <Text style={styles.congrats}>Parabéns!</Text>
          <Text style={styles.title}>
            {stageTitle ?? `Etapa ${stageNumber}`}
          </Text>
          <Text style={styles.subtitle}>concluída com sucesso!</Text>

          {/* Points earned */}
          {typeof pointsEarned === 'number' && pointsEarned > 0 ? (
            <View style={styles.pointsCard}>
              <Text style={styles.pointsLabel}>PONTOS CONQUISTADOS</Text>
              <Text style={styles.pointsValue}>+{pointsEarned.toLocaleString('pt-BR')}</Text>
            </View>
          ) : null}

          {/* Message */}
          <View style={styles.messageCard}>
            <Text style={styles.messageText}>
              Você demonstrou dedicação e esforço. Cada tela concluída é um passo em direção à sua independência. Continue!
            </Text>
          </View>

          {/* Actions */}
          <Pressable
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('LearnerHome')}
            accessibilityRole="button"
            accessibilityLabel="Continuar para o início"
          >
            <Text style={styles.primaryBtnText}>CONTINUAR</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('LearnerScore')}
            accessibilityRole="button"
            accessibilityLabel="Ver minha pontuação"
          >
            <Text style={styles.secondaryBtnText}>VER MINHA PONTUAÇÃO</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 10,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  wrapper: {
    alignItems: 'center',
    gap: 16,
  },

  // Seal badge
  sealWrap: {
    marginBottom: 8,
  },
  sealOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f59e0b',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  sealMiddle: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: '#fbbf24',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  sealInner: {
    alignItems: 'center',
    gap: 0,
  },
  sealStar: {
    fontSize: 22,
    color: '#ffffff',
  },
  sealNumber: {
    fontSize: 40,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 42,
  },
  sealLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 2,
  },

  // Texts
  congrats: {
    fontSize: 20,
    fontWeight: '700',
    color: learnerTheme.textMuted,
    marginTop: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: learnerTheme.textStrong,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: learnerTheme.text,
    fontWeight: '500',
    marginTop: -8,
  },

  // Points
  pointsCard: {
    width: '100%',
    backgroundColor: '#111111',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 6,
  },
  pointsLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  pointsValue: {
    color: '#f59e0b',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1,
  },

  // Message
  messageCard: {
    width: '100%',
    backgroundColor: learnerTheme.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: learnerTheme.border,
    padding: 16,
  },
  messageText: {
    color: learnerTheme.text,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },

  // Buttons
  primaryBtn: {
    width: '100%',
    backgroundColor: '#111111',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  secondaryBtn: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#111111',
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
