import BottomSheet, { BottomSheetView, type BottomSheetBackgroundProps } from '@gorhom/bottom-sheet';
import React, { forwardRef, ReactNode, useCallback, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { Glass } from './Glass';
import type { NativeSheetRef } from './NativeSheet';

type PersistentSheetProps = {
  snapPoints: (string | number)[];
  children: ReactNode;
  onChange?: (index: number) => void;
  enablePanDownToClose?: boolean;
  topInset?: number;
  /** Padding so content clears an overlaying native tab bar. */
  bottomInset?: number;
  /**
   * Render the sheet chrome as Liquid Glass (iOS 26+) instead of a solid fill,
   * so whatever sits behind the sheet blurs through it — what the UIKit sheet
   * gave us for free. Falls back to a translucent fill off iOS 26.
   */
  glassBackground?: boolean;
  backgroundStyle?: object;
};

/**
 * JS-driven persistent sheet (@gorhom) exposing the NativeSheetRef API.
 *
 * NativeSheet.ios is a UIKit modal sheet — iOS presents it over the whole
 * window, native tab bar included, so a screen whose sheet is always up
 * (Explore) buries the tabs. This one renders inside the screen's own view
 * hierarchy instead, leaving the tab bar visible and tappable. Use it for
 * always-on sheets; keep NativeSheet for transient modals.
 */
export const PersistentSheet = forwardRef<NativeSheetRef, PersistentSheetProps>(
  function PersistentSheet(
    {
      snapPoints,
      children,
      onChange,
      enablePanDownToClose = false,
      topInset,
      bottomInset,
      glassBackground = false,
      backgroundStyle,
    },
    ref,
  ) {
    const sheetRef = useRef<BottomSheet>(null);
    const lastIndexRef = useRef(0);

    // `glassClip` last so it overrides any opaque backgroundColor the caller
    // passed in backgroundStyle — an opaque fill under the glass defeats it.
    const renderGlassBackground = useCallback(
      ({ style }: BottomSheetBackgroundProps) => (
        <View style={[style, styles.glassClip]}>
          <Glass style={styles.glassFill} glassStyle="regular" />
        </View>
      ),
      [],
    );

    useImperativeHandle(ref, () => ({
      present: () => sheetRef.current?.snapToIndex(lastIndexRef.current),
      dismiss: () => sheetRef.current?.close(),
      snapToIndex: (index: number) => sheetRef.current?.snapToIndex(index),
    }));

    return (
      <BottomSheet
        ref={sheetRef}
        // Starts open: the screen's first present() can fire before the sheet
        // finishes mounting, and an early imperative snapToIndex gets dropped.
        index={0}
        snapPoints={snapPoints}
        onChange={(index) => {
          if (index >= 0) lastIndexRef.current = index;
          onChange?.(index);
        }}
        enablePanDownToClose={enablePanDownToClose}
        enableOverDrag={false}
        topInset={topInset}
        backgroundStyle={backgroundStyle ?? styles.background}
        backgroundComponent={glassBackground ? renderGlassBackground : undefined}
        handleIndicatorStyle={styles.indicator}
        activeOffsetX={[-15, 15]}
        activeOffsetY={[-5, 5]}
      >
        <BottomSheetView style={[styles.content, bottomInset ? { paddingBottom: bottomInset } : null]}>
          {children}
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#fff',
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  indicator: {
    backgroundColor: '#E5E5E5',
    width: 36,
  },
  content: {
    flex: 1,
  },
  glassClip: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  glassFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
