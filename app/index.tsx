import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import * as Speech from 'expo-speech';


export default function MriAnalyzer() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission denied", "Allow access to media library.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: false,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setResult(null);
      analyzeImage(asset);
    }
  };

  interface ImageAsset {
    uri: string;
    type?: string;
    name?: string;
  }

  interface AnalysisResult {
    speaking: string;
    image: string | null;
  }

  const analyzeImage = async (imageAsset: ImageAsset): Promise<void> => {
    setIsAnalyzing(true);
    try {
      const formData = new FormData();
      const file = {
        uri: imageAsset.uri,
        type: "image/jpeg",
        name: "upload.jpg",
      } as any;

      formData.append("file", file);

      const response = await fetch("http://192.168.45.171:8000/predict/", {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Prediction request failed: ${errorText}`);
      }

      const data: AnalysisResult = await response.json();

      Speech.speak(data.speaking);
      setResult({
        speaking: data.speaking,
        image: data.image,
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to analyze image. Try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Button title="Select MRI Image" onPress={pickImage} />

      {imageUri && (
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="contain"
        />
      )}

      {isAnalyzing && <ActivityIndicator size="large" color="#0000ff" />}

      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>Speaking:</Text>
          <Text style={styles.resultValue}>{result.speaking}</Text>
          <Button
            title="Listen to Audio"
            onPress={() => {
              if (result?.speaking) {
                Speech.speak(result.speaking);
              }
            }}
          />

          {/* <Image
                source={{ uri: `data:image/png;base64,${JSON.stringify(result.image)}` }}
                style={styles.image}
                resizeMode="contain"
                /> */}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 60,
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 300,
    marginTop: 20,
  },
  resultContainer: {
    marginTop: 30,
    alignItems: "center",
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  resultValue: {
    fontSize: 20,
    marginBottom: 10,
    color: "#007AFF",
  },
  disclaimer: {
    marginTop: 20,
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
});
