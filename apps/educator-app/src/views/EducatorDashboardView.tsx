import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Button,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { EducatorRepositoryImpl } from '../data/repositories/educator-repository.impl';
import { httpClient } from '../infra/api/http-client';
import { EducatorStorage } from '../infra/storage/educator-storage';
import { EducatorRootStackParamList } from '../types';
import { useEducatorDashboardViewModel } from '../viewmodels/useEducatorDashboardViewModel';

export function EducatorDashboardView() {
  const viewModel = useEducatorDashboardViewModel();
  const { cleanup } = viewModel;
  const navigation = useNavigation<NativeStackNavigationProp<EducatorRootStackParamList>>();

  useEffect(() => cleanup, [cleanup]);

  const handleLogout = async () => {
    try {
      const repository = new EducatorRepositoryImpl();
      await repository.logoutEducator();
    } catch {
      // No-op: local cleanup still proceeds.
    } finally {
      await EducatorStorage.clearAuthSession();
      httpClient.setAuthToken(null);
      navigation.replace('EducatorLogin');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Letras - Educador</Text>
        <View style={styles.actions}>
          <Button title="Sair" onPress={() => void handleLogout()} />
        </View>

        <Text style={styles.label}>Nome do aprendiz</Text>
        <TextInput
          style={styles.input}
          value={viewModel.learnerNameInput}
          onChangeText={viewModel.setLearnerNameInput}
          placeholder="Ex.: Maria do Carmo"
        />

        <View style={styles.actions}>
          <Button title="Criar LearnerProfile" onPress={() => void viewModel.createLearnerProfile()} />
        </View>

        <Text style={styles.label}>Learner Profile ID</Text>
        <TextInput
          style={styles.input}
          value={viewModel.learnerProfileIdInput}
          onChangeText={viewModel.setLearnerProfileIdInput}
          placeholder="Cole o learnerProfileId"
          autoCapitalize="none"
        />

        <View style={styles.actions}>
          <Button title="Carregar temas" onPress={() => void viewModel.loadThemes()} />
        </View>

        {viewModel.themes.map((theme) => (
          <View key={theme.id} style={styles.themeCard}>
            <Text style={styles.themeTitle}>{theme.name}</Text>
            <Button title="Selecionar tema" onPress={() => viewModel.setSelectedThemeId(theme.id)} />
          </View>
        ))}

        <Text style={styles.label}>Tema selecionado: {viewModel.selectedThemeId ?? 'Nenhum'}</Text>

        <View style={styles.actions}>
          <Button title="Atribuir tema ao aprendiz" onPress={() => void viewModel.assignSelectedTheme()} />
        </View>

        <View style={styles.actions}>
          <Button title="Entrar na sessão realtime" onPress={() => void viewModel.joinLearnerSession()} />
        </View>

        <View style={styles.actions}>
          <Button
            title={viewModel.isLocked ? 'Destravar sessão' : 'Travar sessão'}
            onPress={() => void viewModel.toggleLock()}
          />
        </View>

        <View style={styles.actions}>
          <Button title="Responder pedido de ajuda" onPress={viewModel.respondHelp} />
        </View>

        <Text style={styles.info}>Sessão bloqueada: {viewModel.isLocked ? 'Sim' : 'Não'}</Text>
        <Text style={styles.info}>Último pedido de ajuda: {viewModel.lastHelpRequest ?? 'Nenhum'}</Text>
        <Text style={styles.info}>
          Último estado do aprendiz: {viewModel.lastLearnerState?.currentView ?? 'Sem atualização'}
        </Text>

        {viewModel.presence ? (
          <Text style={styles.info}>
            Presença - Educadores: {viewModel.presence.educatorsOnline.length} | Aprendizes:{' '}
            {viewModel.presence.learnersOnline.length}
          </Text>
        ) : null}

        {viewModel.isBusy ? <ActivityIndicator size="small" /> : null}

        {viewModel.statusMessage ? <Text style={styles.success}>{viewModel.statusMessage}</Text> : null}
        {viewModel.errorMessage ? <Text style={styles.error}>{viewModel.errorMessage}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  content: {
    padding: 20,
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actions: {
    marginTop: 4,
    marginBottom: 4,
  },
  themeCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  themeTitle: {
    fontWeight: '600',
  },
  info: {
    fontSize: 13,
    color: '#334155',
  },
  success: {
    color: '#047857',
  },
  error: {
    color: '#b91c1c',
  },
});
