import React from 'react';
import { StyleSheet, TextInput, Text, View } from 'react-native';

// Campo de texto reutilizable con etiqueta para formularios.
export default function AppTextInput({
  placeholder,
  label,
  style,
  value,
  onChangeText,
  secureTextEntry
}) {

  return (
    <View style={styles.container}>

      {label && <Text style={styles.label}>{label}</Text>}

      <TextInput
        placeholder={placeholder}
        style={[styles.input, style]}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
      />

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    width: "85%",
    marginBottom: 15,
  },

  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
    alignSelf: "flex-start",
    fontWeight: "500",
  },

  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#27AE60",
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#fff",
  },

});
