import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import React, { forwardRef, ReactNode, useImperativeHandle, useRef } from 'react';
import { StyleSheet } from 'react-native';

import type { NativeSheetRef } from './NativeSheet';

type PersistentSheetProps = {
  snapPoints: (string | number)[];
  children: ReactNode;
  onChange?: (index: number) => void;
  enablePanDownToClose?: boolean;
  topInset?: number;
  /** Padding so content clears an overlaying native tab bar. */
  bottomInset?: number;
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
    { snapPoints, children, onChange, enablePanDownToClose = false, topInset, bottomInset, backgroundStyle },
    ref,
  ) {
    const sheetRef = useRef<BottomSheet>(null);
    const lastIndexRef = useRef(0);

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
});
