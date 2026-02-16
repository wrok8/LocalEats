import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Dimensions } from 'react-native';
import Svg, { Path, Defs, Pattern, Image, Circle } from "react-native-svg";
import Button from '../Components/Button';

const { width, height } = Dimensions.get("window");

export default function LoginRegister({ navigation }) {

  function SvgTop() {
    return (
      <Svg
        width="100%"
        height={height * 0.3} // 40% del alto de la pantalla
        viewBox="0 0 430 260"
        preserveAspectRatio="none"
      >
        <Defs>
          <Pattern
            id="pattern"
            patternUnits="userSpaceOnUse"
            width={1024}
            height={1024}
            patternTransform="scale(0.4)"
          >
            <Image
              href={require("../assets/FondoPatron.png")}
              width={1024}
              height={1024}
              opacity={0.15}
            />
          </Pattern>
        </Defs>

        <Path
          fill="#27AE60"
          d="M0,0 H430 V180
             C350,210 280,230 215,210
             C150,190 100,150 0,170 Z"
        />

        <Path
          fill="url(#pattern)"
          d="M0,0 H430 V180
             C350,210 280,230 215,210
             C150,190 100,150 0,170 Z"
        />
      </Svg>
    );
  }

  function SvgLogo() {
    return (
      <Svg
        width={width * 0.6} // 60% del ancho de pantalla
        height={width * 0.6} 
        viewBox="0 0 290 250"
      >
        <Defs>
          <Pattern
            id="logoPattern"
            patternUnits="userSpaceOnUse"
            width={265}
            height={250}
          >
            <Image
              href={require("../assets/logo.png")}
              width={300}
              height={300}
            />
          </Pattern>
        </Defs>

        <Path
          fill="url(#logoPattern)"
          d="M0 0h265v265H0z"
        />
      </Svg>
    );
  }

  function SvgLineal() {
    return (
      <Svg
        width={width * 0.9}
        height={24}
      >
        <Path
          stroke="#575757"
          strokeWidth="1"
          d={`M0 12 H${width*0.45 - 10}`}
        />
        <Circle
          cx={width*0.45}
          cy="12"
          r="6"
          fill="#27AE60"
        />
        <Path
          stroke="#575757"
          strokeWidth="1"
          d={`M${width*0.45 + 10} 12 H${width*0.9}`}
        />
      </Svg>
    );
  }


        {/*MOSTRAR COMPONENTES*/}

  return (
    <View style={styles.mainContainer}>
      {/* Fondo */}
      <View style={styles.topContainer}>
        <SvgTop />
      </View>

      {/* Logo */}
      <View style={styles.logoContainer}>
        <SvgLogo />
      </View>

      {/* Botones */}
      <View style={styles.contentContainer}>
        <Button
          title="Iniciar Sesión"
          variant="primary"
          onPress={() => navigation.navigate("Login")}
        />
        <View style={{ marginTop: 20 }}>
          <Button
            title="Registrarse"
            variant="secondary"
            onPress={() => navigation.navigate("Register")}
          />
        </View>
      </View>

      {/* Línea decorativa */}
      <View style={styles.lineContainer}>
        <SvgLineal />
      </View>

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#f1f1f1",
  },

  topContainer: {
    width: "100%",
    height: height * 0.4,
  },

  logoContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: -height * 0.2, // logo sobre el fondo
  },

  contentContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },

  lineContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 30,
  },
});
