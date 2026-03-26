import { useEffect } from 'react';
import {
  ActivityIndicator,
  Button,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLearnerHomeViewModel } from '../viewmodels/useLearnerHomeViewModel';

export function LearnerHomeView() {
  const viewModel = useLearnerHomeViewModel();
  const { initialize, cleanup } = viewModel;

  useEffect(() => {
    void initialize();
    return cleanup;
  }, [cleanup, initialize]);

  if (viewModel.loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text>Preparando sessão do aprendiz...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Letras - Aprendiz</Text>
        <Text style={styles.label}>Learner Profile ID: {viewModel.learnerProfileId ?? 'N/A'}</Text>
        <Text style={styles.label}>Device ID: {viewModel.deviceId ?? 'N/A'}</Text>
        <Text style={styles.label}>Sessão bloqueada: {viewModel.isLocked ? 'Sim' : 'Não'}</Text>

        <Text style={styles.section}>Temas atribuídos</Text>
        {viewModel.themeNames.length === 0 ? <Text>Nenhum tema atribuído ainda.</Text> : null}
        {viewModel.themeNames.map((name) => (
          <Text key={name} style={styles.bullet}>
            - {name}
          </Text>
        ))}

        <View style={styles.actions}>
          <Button title="Sincronizar estado atual" onPress={() => void viewModel.syncCurrentState()} />
        </View>
        <View style={styles.actions}>
          <Button title="Solicitar ajuda" onPress={viewModel.requestHelp} />
        </View>

        {viewModel.helpAcknowledgedAt ? (
          <Text style={styles.feedback}>Ajuda recebida em {viewModel.helpAcknowledgedAt}</Text>
        ) : null}

        {viewModel.presence ? (
          <Text style={styles.feedback}>
            Educadores online: {viewModel.presence.educatorsOnline.length} | Aprendizes online:{' '}
            {viewModel.presence.learnersOnline.length}
          </Text>
        ) : null}

        {viewModel.errorMessage ? <Text style={styles.error}>{viewModel.errorMessage}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fb',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#13315c',
  },
  section: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
  },
  bullet: {
    fontSize: 14,
    color: '#1f2937',
  },
  actions: {
    marginTop: 8,
  },
  feedback: {
    marginTop: 8,
    color: '#0f766e',
  },
  error: {
    marginTop: 8,
    color: '#b91c1c',
  },
});
