import React, { useState } from "react";
import {
  View,
  Text,
  Alert,
  StyleSheet,
  Dimensions
} from "react-native";

import Svg, { Path, Circle } from "react-native-svg";

import Button from "../Components/Button";
import ImgTop from "../Components/ImageTop";
import AppTextInput from "../Components/TextTittle";

import {
  createUserWithEmailAndPassword
} from "firebase/auth";

import {
  doc,
  setDoc
} from "firebase/firestore";

import {
  auth,
  db
} from "../firebaseConfig";

const { width } =
  Dimensions.get("window");

export default function RegisterScreen({
  navigation
}) {
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const registerUser =
    async () => {
      if (
        !email ||
        !password
      ) {
        Alert.alert(
          "Error",
          "Completa todos los campos"
        );
        return;
      }

      try {
        const userCredential =
          await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );

        const user =
          userCredential.user;

        // GUARDAR EN FIRESTORE
        await setDoc(
          doc(
            db,
            "users",
            user.uid
          ),
          {
            email:
              user.email,
            name: email.split(
              "@"
            )[0],
            role:
              "user",
            createdAt:
              new Date()
          }
        );

        Alert.alert(
          "Éxito",
          "Usuario registrado correctamente"
        );

        navigation.replace(
          "Login"
        );
      } catch (error) {
        console.log(
          "Error registro:",
          error
        );

        Alert.alert(
          "Error",
          error.message
        );
      }
    };

  return (
    <View
      style={
        styles.mainContainer
      }
    >
      {/* HEADER */}
      <ImgTop title="Crear Cuenta" />

      {/* INPUTS */}
      <View
        style={
          styles.contentContainer
        }
      >
        <AppTextInput
          label="Correo"
          placeholder="Ingresa tu correo"
          value={email}
          onChangeText={
            setEmail
          }
        />

        <AppTextInput
          label="Contraseña"
          placeholder="Crea una contraseña"
          secureTextEntry
          value={
            password
          }
          onChangeText={
            setPassword
          }
        />
      </View>

      {/* BOTÓN */}
      <View
        style={
          styles.buttonContainer
        }
      >
        <Button
          title="Registrarse"
          variant="primary"
          onPress={
            registerUser
          }
        />
      </View>

      {/* LOGIN */}
      <View
        style={
          styles.loginContainer
        }
      >
        <Text
          style={
            styles.loginText
          }
        >
          ¿Ya tienes cuenta?{" "}
          <Text
            style={
              styles.loginLink
            }
            onPress={() =>
              navigation.navigate(
                "Login"
              )
            }
          >
            Inicia sesión
          </Text>
        </Text>
      </View>

      {/* LÍNEA */}
      <View
        style={
          styles.lineContainer
        }
      >
        <SvgLineal />
      </View>
    </View>
  );
}

/* LÍNEA DECORATIVA */
function SvgLineal() {
  return (
    <Svg
      width={
        width * 0.9
      }
      height={24}
    >
      <Path
        stroke="#575757"
        strokeWidth="1"
        d={`M0 12 H${
          width * 0.45 -
          10
        }`}
      />

      <Circle
        cx={
          width * 0.45
        }
        cy="12"
        r="6"
        fill="#27AE60"
      />

      <Path
        stroke="#575757"
        strokeWidth="1"
        d={`M${
          width * 0.45 +
          10
        } 12 H${
          width * 0.9
        }`}
      />
    </Svg>
  );
}

/* ESTILOS */
const styles =
  StyleSheet.create({
    mainContainer: {
      flex: 1,
      backgroundColor:
        "#f1f1f1"
    },

    contentContainer: {
      marginTop: 150,
      width: "100%",
      alignItems:
        "center"
    },

    buttonContainer: {
      width: "100%",
      alignItems:
        "center",
      marginTop: 40
    },

    loginContainer: {
      marginTop: 20,
      alignItems:
        "center"
    },

    loginText: {
      fontSize: 14,
      color: "#555"
    },

    loginLink: {
      color:
        "#27AE60",
      fontWeight:
        "bold"
    },

    lineContainer: {
      width: "100%",
      alignItems:
        "center",
      marginTop: 30
    }
  });