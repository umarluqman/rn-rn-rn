import { StyleSheet, View, useWindowDimensions } from "react-native";

import { BubblePacking } from "@/components/BubblePacking";
import { GestureHandler } from "@/components/GestureHandler";
import { utxos } from "@/data";
import { useGestures } from "@/hooks/useGestures";
import { useImageLayout } from "@/hooks/useImageLayout";
import { Canvas } from "@shopify/react-native-skia";
import { hierarchy, pack } from "d3";
import React, { useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export enum Keychain {
  Internal,
  External,
}

export interface Utxo {
  txid: string;
  vout: number;
  value: number;
  timestamp?: Date;
  label?: string;
  addressTo?: string;
  keychain: Keychain;
}

export interface UtxoListBubble {
  id: string;
  value: number;
  children: UtxoListBubble[];
}

export const outpoint = (u: Utxo) => `${u.txid}:${u.vout}`;

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();

  const GRAPH_HEIGHT = height;
  const GRAPH_WIDTH = width;

  const canvasSize = { width: GRAPH_WIDTH, height: GRAPH_HEIGHT };

  console.log({ utxos });
  const utxoList = utxos.map((data) => {
    return {
      id: outpoint(data),
      children: [],
      value: data.value,
    };
  });

  const utxoPack = useMemo(() => {
    const utxoHierarchy = () =>
      hierarchy<UtxoListBubble>({
        id: "root",
        children: utxoList,
        value: utxoList.reduce((acc, cur) => acc + cur.value, 0),
      })
        .sum((d) => d?.value ?? 0)
        .sort((a, b) => (b?.value ?? 0) - (a?.value ?? 0));

    const createPack = pack<UtxoListBubble>()
      .size([GRAPH_WIDTH, GRAPH_HEIGHT])
      .padding(4);

    return createPack(utxoHierarchy()).leaves();
  }, [utxoList]);

  const { width: w, height: h, center, onImageLayout } = useImageLayout({});
  const { animatedStyle, gestures, transform } = useGestures({
    width: w,
    height: h,
    center,
    isDoubleTapEnabled: true,
    maxPanPointers: 2,
    minPanPointers: 1,
    maxScale: 50,
    minScale: 0.1,
  });

  const [selectedCircle, setSelectedCircle] = useState<string[]>([]);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container]}>
        <Canvas
          style={[
            {
              ...canvasSize,
              borderWidth: 1,
              borderColor: "red",
            },
          ]}
          onLayout={onImageLayout}
        >
          <BubblePacking
            transform={transform}
            selectedCircle={selectedCircle}
            utxoPack={utxoPack}
            canvasSize={canvasSize}
          />
        </Canvas>
        <GestureHandler
          contentContainerAnimatedStyle={animatedStyle}
          canvasSize={canvasSize}
          onLayoutContent={onImageLayout}
          selectedCircle={selectedCircle}
          setSelectedCircle={setSelectedCircle}
          bubblePack={utxoPack}
          zoomGesture={gestures}
        />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#131313",
  },
});
